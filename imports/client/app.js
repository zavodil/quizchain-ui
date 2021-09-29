import * as nearAPI from 'near-api-js';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

const { connect, keyStores, WalletConnection, Contract, utils } = nearAPI;

const app = {
  user: new ReactiveVar(false),
  activeQuiz: new ReactiveVar(false),
  activeQuizQuestion: new ReactiveVar(0),
  _quizData: new ReactiveVar([]),
  _isLoggingIn: new ReactiveVar(false),
  formatNearAmount(str) {
    return parseFloat(utils.format.formatNearAmount(str))
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
      const quiz = await app.contract.get_quiz({ quiz_id: qid });
      quiz.totalPrizesQty = 0;

      if (quiz.status === 'InProgress') {
        quiz.totalAvailableRewards = quiz.available_rewards.reduce((prev, cur) => {
          if (cur.claimed === false) {
            quiz.totalPrizesQty++;
            return prev + parseFloat(utils.format.formatNearAmount(cur.amount));
          }
          return 0;
        }, 0);

        quizData.push(quiz);
      }
    }

    this._quizData.set(quizData);
    console.log(quizData);
  },
  async loginNEARWallet() {
    this._isLoggingIn.set(true);
    app.wallet.requestSignIn(Meteor.settings.public.nearConfig.contractName, 'Quiz Chain');
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
      viewMethods: ['get_quiz', 'get_active_quizzes', 'gets_quiz_stats', 'get_game', 'get_distributed_rewards_by_quiz'],
      changeMethods: ['claim_reward', 'start_game', 'send_answer'],
      sender: app._account.accountId
    });
  }
});

export { app };
