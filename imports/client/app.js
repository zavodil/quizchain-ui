import * as nearAPI from 'near-api-js';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

const { connect, keyStores, WalletConnection, Contract } = nearAPI;

const dummyData = [{
  _id: 1,
  name: 'Quiz: Facts about cryptocurrencies',
  reward: '20 NEAR',
  conditions: 'First 5 will win',
}, {
  _id: 2,
  name: 'Quiz: Name one right',
  reward: '40 NEAR',
  conditions: 'First 3 will win',
}, {
  _id: 3,
  name: 'Quiz: History of fiat',
  reward: '50 NEAR',
  conditions: 'First 10 — are winners!',
}, {
  _id: 4,
  name: 'Quiz: Economy',
  reward: '50 NEAR',
  conditions: 'Only the first will win!',
}, {
  _id: 5,
  name: 'Quiz: Trade',
  reward: '60 NEAR',
  conditions: 'First 5 will win',
}, {
  _id: 6,
  name: 'Quiz: Digital silk road',
  reward: '65 NEAR',
  conditions: 'First 4 are winners!',
}, {
  _id: 7,
  name: 'Quiz: Digital freedom',
  reward: '70 NEAR',
  conditions: 'Be the first to claim the prize',
}];

const app = {
  user: new ReactiveVar(false),
  _quizData: new ReactiveVar(false),
  _isLoggingIn: new ReactiveVar(false),
  getQuizData() {
    const quizData = this._quizData.get();
    if (!quizData || !quizData.length) {
      return [];
    }

    return quizData;
  },
  async fetchQuizData() {
    // TODO: WRITE LOGIC OF GETTING QUIZDATA HERE:
    // AND REPLACE dummyData VARIABLE WITH REAL DATA
    const quizData = await app.contract.get_active_quizzes();
    console.log(quizData);
    // this._quizData.set(quizData);
  },
  async loginNEARWallet() {
    this._isLoggingIn.set(true);
    app.wallet.requestSignIn();
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
      // View methods are read-only – they don't modify the state, but usually return some value
      viewMethods: ['get_quiz', 'get_active_quizzes'],
      // Change methods can modify the state, but you don't receive the returned value when called
      // changeMethods: ['increment', 'decrement', 'reset'],
      // Sender is the account ID to initialize transactions.
      // getAccountId() will return empty string if user is still unauthorized
      sender: app._account.accountId
    });
  }
});

export { app };
