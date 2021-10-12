import * as nearAPI from 'near-api-js';

import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {BN} from 'bn.js';

const {connect, keyStores, WalletConnection, Contract, utils} = nearAPI;

const app = {
  user: new ReactiveVar(false),
  activeQuiz: new ReactiveVar(false),
  activeQuizQuestion: new ReactiveVar(0),
  _quizData: new ReactiveVar([]),
  _isLoggingIn: new ReactiveVar(false),
  maxGas: 200000000000000,
  storageDepositGas: 5000000000000,
  claimGas: 80000000000000,
  tokens_account_ids: {
    '': {
      name: 'NEAR',
      convertToHuman: utils.format.formatNearAmount,
      convertToBlockchain: utils.format.parseNearAmount,
    },
    'rft.tokenfactory.testnet': {
      name: 'RFT',
      convertToHuman: convertFromE8,
      convertToBlockchain: convertToE8,
    },
  },
  formatNearAmount(str) {
    return parseFloat(utils.format.formatNearAmount(str));
  },
  getQuizData() {
    const quizData = this._quizData.get();
    if (!quizData || !quizData.length) {
      return [];
    }

    return quizData;
  },
  async fetchQuizData() {
    const quizData = [];
    const quizIds = await app.contract.get_active_quizzes();

    for await (const qid of quizIds) {
      const quiz = await app.contract.get_quiz({quiz_id: qid});
      if (quiz) {
        quiz._id = `${quiz.id}`;
        quiz.totalPrizesQty = 0;

        if (quiz.status === 'InProgress') {
          quiz.totalAvailableRewards = quiz.available_rewards.reduce((prev, cur) => {
            if (cur.claimed === false) {
              quiz.totalPrizesQty++;
              return prev + parseFloat(this.convertAmount(cur.amount, quiz.token_account_id, 'fromBlockchain'));
            }
            return 0;
          }, 0);

          quiz.tokenTicker = this.tokens_account_ids[quiz.token_account_id || ''].name;
          quizData.push(quiz);
        }
      }
    }

    this._quizData.set(quizData);
  },
  async loginNEARWallet() {
    this._isLoggingIn.set(true);
    app.wallet.requestSignIn(Meteor.settings.public.nearConfig.contractName, 'Quiz Chain');
  },
  convertAmount(input, contract, direction) {
    let token = this.tokens_account_ids[contract || ''];
    let amount;
    if (token) {
      if (direction === 'toBlockchain') {
        amount = token.convertToBlockchain(input);
      } else {
        amount = parseFloat(token.convertToHuman(input));
      }
    }
    else {
      console.log('Wrong contract' + contract);
    }
    return amount;
  }
};

Template.registerHelper('appUser', () => app.user.get());
Template.registerHelper('isLoggingIn', () => app._isLoggingIn.get());

Meteor.startup(async () => {
  app.near = await connect({
    deps: {
      keyStore: new keyStores.BrowserLocalStorageKeyStore()
    },
    ...Meteor.settings.public.nearConfig
  });
  app.wallet = new WalletConnection(app.near);

  if (app.wallet.isSignedIn()) {
    app._account = app.wallet.account();
    app.user.set(app._account);

    app.contract = await new Contract(app._account, Meteor.settings.public.nearConfig.contractName, {
      viewMethods: ['get_quiz', 'get_active_quizzes', 'gets_quiz_stats', 'get_game', 'get_distributed_rewards_by_quiz', 'get_answers', 'get_quizzes_by_owner', 'get_users_with_final_hash'],
      changeMethods: ['claim_reward', 'start_game', 'send_answer', 'restart_game', 'create_quiz', 'reveal_final_hash', 'reveal_answers'],
      sender: app._account.accountId
    });
  }
});

export {app};

function convertToE18(amount) {
  return new BN(Math.round(amount * 100000000)).mul(new BN('10000000000')).toString();
}

function convertToE8(amount) {
  return new BN(Math.round(amount * 1000000)).mul(new BN('100')).toString();
}

function convertFromE8(amount) {
  return (Math.round(amount / 10000) / 10000);
}
