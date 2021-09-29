import { app } from '/imports/client/app.js';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import confetti from 'canvas-confetti';

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
  this.claimProcessing = new ReactiveVar(false);
  this.quizId = parseInt(this.data.params.quizId);

  (async () => {
    this.game = await app.contract.get_game({ quiz_id: this.quizId, account_id: app._account.accountId });
    if (!this.game) {
      FlowRouter.go('home');
    }

    this.quiz = await app.contract.get_quiz({ quiz_id: this.quizId });
    if (!this.quiz) {
      FlowRouter.go('home');
    }

    this.reward = false;

    if (this.quiz?.distributed_rewards?.length) {
      for (const reward of this.quiz.distributed_rewards) {
        if (reward.winner_account_id === app._account.accountId) {
          this.reward = reward;
          this.reward.amountInt = app.formatNearAmount(this.reward.amount);
          throwConfettis();
          break;
        }
      }
    }

    this.isLoading.set(false);
  })();
});

Template.results.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  claimProcessing() {
    return Template.instance().claimProcessing.get();
  },
  quiz() {
    return Template.instance().quiz;
  },
  reward() {
    return Template.instance().reward;
  }
});

Template.results.events({
  async 'click [data-claim]' (e, template) {
    e.preventDefault();
    template.claimProcessing.set(true);
    await app.contract.claim_reward({ quiz_id: template.quizId });
    FlowRouter.go('home');
    return false;
  }
});
