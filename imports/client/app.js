import * as nearAPI from 'near-api-js';

import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {BN} from 'bn.js';

const {connect, keyStores, WalletConnection, Contract, utils} = nearAPI;

const urlParams = new URLSearchParams(window.location.search);
window.localStorage.setItem('referrer', urlParams.get('r'));

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
  },
  'aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near': {
    name: 'AURORA',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  },
  'token.burrow.near': {
    name: 'BRRR',
    convertToHuman: convertFromE18,
    convertToBlockchain: convertToE18,
  },
  'usn': {
    name: 'USN',
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

    // near social data
    let socialKeys = quizData.map(stat => `${stat.owner_id}/profile/**`);
    await getSocial(socialKeys).then((socialData) => {
      Object.entries(socialData).forEach(account => {
        for (let i = 0; i < quizData.length; i++) {
          if (quizData[i].owner_id === account[0]) {
            quizData[i].name = account[1].profile?.name;
            quizData[i].image = account[1].profile?.image?.url;
            break;
          }
        }
      });
    });

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
      quiz.totalAvailableRewards = Math.round(quiz.totalAvailableRewards * 100) / 100;

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
      viewMethods: ['get_quiz', 'get_active_quizzes', 'get_quiz_stats', 'get_game', 'get_distributed_rewards_by_quiz', 'get_answers', 'get_quizzes_by_owner', 'get_quizzes_by_player', 'get_users_with_final_hash', 'get_affiliates', 'get_revealed_answer'],
      changeMethods: ['claim_reward', 'start_game', 'send_answer', 'restart_game', 'create_quiz', 'reveal_final_hash', 'reveal_answers'],
      sender: app._account.accountId
    });
  }
});

export {app, getSocial};

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

function getSocial(request) {
  return fetch('https://api.near.social/get', {
    'headers': {
      'accept': '*/*',
      'accept-language': 'en-GB,en;q=0.6',
      'content-type': 'application/json',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'sec-gpc': '1',
      'Referer': 'https://near.social/',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    'body': JSON.stringify({keys: request}), //'{\"keys\":[\"*/nametag/whendacha.near/tags/*\"]}',
    'method': 'POST'
  }).then((response) => {
    if(response.ok) {
      return response.json();
    }
    throw new Error('Server response wasn\'t OK');
  });
}
