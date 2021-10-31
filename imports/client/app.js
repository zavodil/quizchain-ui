import * as nearAPI from 'near-api-js';

import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {BN} from 'bn.js';

const {connect, keyStores, WalletConnection, Contract, utils} = nearAPI;

const mainnetTokens = {
  '': {
    name: 'NEAR',
    convertToHuman: utils.format.formatNearAmount,
    convertToBlockchain: utils.format.parseNearAmount,
  },
  '6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near': {
    name: 'DAI',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  },
  'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near': {
    name: 'wETH',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  },
  'token.v2.ref-finance.near': {
    name: 'REF',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  },
  'token.skyward.near': {
    name: 'SKYWARD',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  },
  'token.paras.near': {
    name: 'PARAS',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  },
  'd9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near': {
    name: 'HAPI',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  }
};

const testnetTokens = {
  '': {
    name: 'NEAR',
    convertToHuman: utils.format.formatNearAmount,
    convertToBlockchain: utils.format.parseNearAmount,
  },
  'rft.tokenfactory.testnet': {
    name: 'Testnet RFT',
    convertToHuman: convertFromE8,
    convertToBlockchain: convertToE8,
  }
};

const app = {
  user: new ReactiveVar(false),
  activeQuiz: new ReactiveVar(false),
  activeQuizQuestion: new ReactiveVar(0),
  _quizData: new ReactiveVar([]),
  _isLoggingIn: new ReactiveVar(false),
  maxGas: 200000000000000,
  storageDepositGas: 5000000000000,
  claimGas: 80000000000000,
  tokens_account_ids:
    Meteor.settings.public.nearConfig.networkId === 'mainnet'
      ? mainnetTokens
      : testnetTokens,
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
          quiz.totalAvailableRewards = Math.round(quiz.totalAvailableRewards * 100) / 100;

          quiz.tokenTicker = this.tokens_account_ids[quiz.token_account_id || ''].name;
          quizData.push(quiz);
        } else if (quiz.status === 'Finished') {
          quiz.totalDistributedRewards = quiz.distributed_rewards.reduce((prev, cur) => {
            return prev + parseFloat(this.convertAmount(cur.amount, quiz.token_account_id, 'fromBlockchain'));
          }, 0);

          quiz.tokenTicker = this.tokens_account_ids[quiz.token_account_id || ''].name;
          quizData.push(quiz);
        }
      }
    }

    this._quizData.set(quizData);
  },
  async fetchQuizById(qid) {
    const quiz = await app.contract.get_quiz({quiz_id: qid});
    if (quiz) {
      quiz._id = `${quiz.id}`;
      quiz.totalPrizesQty = 0;
      quiz.totalAvailableRewards = quiz.available_rewards.reduce((prev, cur) => {
        if (cur.claimed === false) {
          quiz.totalPrizesQty++;
          return prev + parseFloat(this.convertAmount(cur.amount, quiz.token_account_id, 'fromBlockchain'));
        }
        return 0;
      }, 0);

      quiz.totalDistributedRewards = quiz.distributed_rewards.reduce((prev, cur) => {
        return prev + parseFloat(this.convertAmount(cur.amount, quiz.token_account_id, 'fromBlockchain'));
      }, 0);

      quiz.tokenTicker = this.tokens_account_ids[quiz.token_account_id || ''].name;
    }
    return quiz;
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
    } else {
      console.log('Wrong contract' + contract);
    }
    return amount;
  },
  urlify(text) {
    if (!text) {
      return '';
    }
    let urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
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
      viewMethods: ['get_quiz', 'get_active_quizzes', 'get_quiz_stats', 'get_game', 'get_distributed_rewards_by_quiz', 'get_answers', 'get_quizzes_by_owner', 'get_quizzes_by_player', 'get_users_with_final_hash'],
      changeMethods: ['claim_reward', 'start_game', 'send_answer', 'restart_game', 'create_quiz', 'reveal_final_hash', 'reveal_answers'],
      sender: app._account.accountId
    });
  }
});

export {app};

function convertToE18(amount) {
  return new BN(Math.round(amount * 100000000)).mul(new BN('10000000000')).toString();
}

function convertFromE18(amount) {
  return (Math.round(amount / 1000000000) / 1000000000);
}

function convertToE8(amount) {
  return new BN(Math.round(amount * 1000000)).mul(new BN('100')).toString();
}

function convertFromE8(amount) {
  return (Math.round(amount / 10000) / 10000);
}
