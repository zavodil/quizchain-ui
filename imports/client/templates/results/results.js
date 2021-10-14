import {app} from '/imports/client/app.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import confetti from 'canvas-confetti';
import * as nearAPI from 'near-api-js';
import {Meteor} from 'meteor/meteor';

import './results.html';

const throwConfettis = () => {
  confetti({
    particleCount: 200,
    spread: 100,
  });
};


// With real data we would pass the quiz info here, and then set as the template state.
Template.results.onCreated(function () {
  this.isLoading = new ReactiveVar(true);
  this.isRestarting = new ReactiveVar(true);
  this.claimProcessing = new ReactiveVar(false);
  this.quizId = parseInt(this.data.params.quizId);

  (async () => {
    this.game = await app.contract.get_game({quiz_id: this.quizId, account_id: app._account.accountId});
    if (!this.game) {
      FlowRouter.go('home');
    }

    this.quiz = await app.contract.get_quiz({quiz_id: this.quizId});
    if (!this.quiz) {
      FlowRouter.go('home');
    }

    this.delayed = (this.quiz?.finality_type === 'DelayedReveal' && this.quiz.status === 'InProgress');

    this.reward = false;
    this.successButNoReward = false;

    if (this.game.answers_quantity === this.quiz.total_questions) {
      if (this.quiz?.distributed_rewards?.length) {
        for (const reward of this.quiz.distributed_rewards) {
          if (reward.winner_account_id === app._account.accountId) {
            this.reward = reward;
            this.reward.amountInt = app.convertAmount(this.reward.amount, this.quiz.token_account_id, 'fromBlockchain');
            this.reward.tokenTicker = app.tokens_account_ids[this.quiz.token_account_id || ''].name;
            throwConfettis();
            break;
          }
        }
      }

      if (!this.reward && this.game.current_hash === this.quiz.success_hash) {
        this.successButNoReward = true;
        throwConfettis();
      }
    }

    this.isLoading.set(false);
    this.isRestarting.set(false);
  })();
});

Template.results.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  isRestarting() {
    return Template.instance().isRestarting.get();
  },
  claimProcessing() {
    return Template.instance().claimProcessing.get();
  },
  quiz() {
    return Template.instance().quiz;
  },
  reward() {
    return Template.instance().reward;
  },
  successButNoReward() {
    return Template.instance().successButNoReward;
  },
  delayed() {
    return Template.instance().delayed;
  }
});


const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
const nearConnection = app.near;
const randomPublicKey = nearAPI.utils.PublicKey.from('ed25519:8fWHD35Rjd78yeowShh9GwhRudRtLLsGCRjZtgPjAtw9');

const _near = {};
_near.keyStore = keyStore;
_near.nearConnection = nearConnection;

_near.walletConnection = app.wallet;

_near.accountId = app.wallet.getAccountId();
_near.account = app.wallet.account();

_near.contract = app.contract;

_near.fetchBlockHash = async () => {
  const block = await nearConnection.connection.provider.block({
    finality: 'final',
  });
  return nearAPI.utils.serialize.base_decode(block.header.hash);
};

_near.fetchBlockHeight = async () => {
  const block = await nearConnection.connection.provider.block({
    finality: 'final',
  });
  return block.header.height;
};

_near.fetchNextNonce = async () => {
  const accessKeys = await _near.account.getAccessKeys();
  return accessKeys.reduce(
    (nonce, accessKey) => Math.max(nonce, accessKey.access_key.nonce + 1),
    1
  );
};

_near.sendTransactions = async (items) => {
  let [nonce, blockHash] = await Promise.all([
    _near.fetchNextNonce(),
    _near.fetchBlockHash(),
  ]);

  const transactions = [];
  let actions = [];
  let currentReceiverId = null;
  items.push([null, null]);
  items.forEach(([receiverId, action]) => {
    if (receiverId !== currentReceiverId) {
      if (currentReceiverId !== null) {
        transactions.push(
          nearAPI.transactions.createTransaction(
            app._account.accountId,
            randomPublicKey,
            currentReceiverId,
            nonce++,
            actions,
            blockHash
          )
        );
        actions = [];
      }
      currentReceiverId = receiverId;
    }
    actions.push(action);
  });
  return await _near.walletConnection.requestSignTransactions(transactions);
};

Template.results.events({
  async 'click [data-claim]'(e, template) {
    e.preventDefault();
    template.claimProcessing.set(true);
    //await app.contract.claim_reward({quiz_id: template.quizId}, app.maxGas);
    const actions = [];

    let quiz = Template.instance().quiz;
    if (quiz.token_account_id) {
      actions.push([
        quiz.token_account_id,
        nearAPI.transactions.functionCall(
          'storage_deposit',
          {
            account_id: app._account.accountId,
            registration_only: true,
          },
          app.storageDepositGas,
          '12500000000000000000000'
        ),
      ]);
    }

    actions.push([
      Meteor.settings.public.nearConfig.contractName,
      nearAPI.transactions.functionCall(
        'claim_reward',
        {
          quiz_id: template.quizId,
        },
        app.claimGas
      ),
    ]);

    await _near.sendTransactions(actions);

    FlowRouter.go('home');
    return false;
  },

  async 'click [data-restart-quiz]'(e, template) {
    e.preventDefault();
    template.isRestarting.set(true);
    await app.contract.restart_game({quiz_id: template.quizId});
    FlowRouter.go('game', {quizId: template.quizId});
    return false;
  }
});



