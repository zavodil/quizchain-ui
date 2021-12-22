import {app} from '/imports/client/app.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import './referrals.css';
import './referrals.html';

const VIEW_LIMIT = 50;

Template.referrals.onCreated(function () {
  this.isLoading = new ReactiveVar(true);
  this.referrals = new ReactiveVar(true);
  this.quizId = parseInt(this.data.params.quizId);

  (async () => {
    this.quiz = await app.contract.get_quiz({quiz_id: this.quizId});
    if (!this.quiz) {
      FlowRouter.go('home');
    }

    let referrals = await app.contract.get_affiliates({quiz_id: this.quizId, from_index: 0, limit: VIEW_LIMIT});
    if (referrals !== null && referrals.length) {
      referrals = referrals.sort((a, b) => b.affiliates - a.affiliates);
    }
    referrals = referrals.filter(affiliate => affiliate.account_id !== 'null');
    this.referrals.set(referrals);
    this.isLoading.set(false);
  })();
});

Template.referrals.onDestroyed(function () {
  if (this.timer) {
    clearInterval(this.timer);
  }
});

Template.referrals.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  quiz() {
    return Template.instance().quiz;
  },
  referrals() {
    return Template.instance().referrals.get();
  }
});

Template.referrals.events({

});
