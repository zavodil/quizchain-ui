import { app } from '/imports/client/app.js';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './leaderboard.css';
import './leaderboard.html';
const VIEW_LIMIT = 20;

Template.leaderboard.onCreated(function () {
  this.isLoading = new ReactiveVar(true);
  this.stats = new ReactiveVar(true);
  this.quizId = parseInt(this.data.params.quizId);
  let stats;
  let newStats;

  (async () => {
    let index = 0;
    while(stats === undefined || newStats.length === VIEW_LIMIT) {
      newStats = await app.contract.gets_quiz_stats({quiz_id: this.quizId, from_index: index * VIEW_LIMIT, limit: VIEW_LIMIT});
      if (!newStats) {
        FlowRouter.go('home');
      } else {
        stats = stats ? stats.concat(newStats) : newStats;
        this.stats.set(stats.sort((a, b) => b.answers_quantity - a.answers_quantity));
      }
      index ++;
    }

    this.quiz = await app.contract.get_quiz({ quiz_id: this.quizId });
    if (!this.quiz) {
      FlowRouter.go('home');
    }

    this.isLoading.set(false);

    this.timer = setInterval(async () => {
      stats = await app.contract.gets_quiz_stats({ quiz_id: this.quizId, from_index: 0, limit: 60 });
      if (stats) {
        this.stats.set(stats);
      }
    }, 20000);
  })();
});

Template.leaderboard.onDestroyed(function () {
  if (this.timer) {
    clearInterval(this.timer);
  }
});

Template.leaderboard.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  quiz() {
    return Template.instance().quiz;
  },
  stats() {
    return Template.instance().stats.get();
  }
});

Template.leaderboard.events({

});
