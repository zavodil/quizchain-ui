import {app} from '/imports/client/app.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import './leaderboard.css';
import './leaderboard.html';

const VIEW_LIMIT = 20;

Template.leaderboard.onCreated(function () {
  this.isLoading = new ReactiveVar(true);
  this.stats = new ReactiveVar(true);
  this.quizId = parseInt(this.data.params.quizId);

  (async () => {
    this.quiz = await app.contract.get_quiz({quiz_id: this.quizId});
    if (!this.quiz) {
      FlowRouter.go('home');
    }

    this.delayed = (this.quiz?.finality_type === 'DelayedReveal' && this.quiz.status === 'InProgress');

    let winners = {};
    if (this.quiz.status === 'Finished') {
      this.quiz.distributed_rewards.map(reward => {
        winners[reward.winner_account_id] = {
          amount: app.convertAmount(reward.amount, this.quiz.token_account_id, 'fromBlockchain'),
          claimed: reward.claimed
        };
      });
      this.quiz.tokenTicker = app.tokens_account_ids[this.quiz.token_account_id || ''].name;
    }

    let stats = undefined;
    let newStats = [];
    let index = 0;
    while (stats === undefined || (newStats !== null && newStats.length === VIEW_LIMIT)) {
      newStats = await app.contract.get_quiz_stats({
        quiz_id: this.quizId,
        from_index: index * VIEW_LIMIT,
        limit: VIEW_LIMIT
      });
      if (this.quiz.status === 'Finished') {
        for (let i = 0; i < newStats.length; i++) {
          if (winners.hasOwnProperty(newStats[i].player_id)) {
            newStats[i].reward = winners[newStats[i].player_id].amount + ' ' + this.quiz.tokenTicker;
            newStats[i].claimed = winners[newStats[i].player_id].claimed ? 'Claimed' : 'Not claimed';
          }
        }
      }
      stats = stats ? stats.concat(newStats) : newStats;
      if (stats !== null && stats.length) {
        stats = stats.sort((a, b) => {
          if (b.answers_quantity === a.answers_quantity) {
            return a.last_answer_timestamp - b.last_answer_timestamp;
          }
          return b.answers_quantity - a.answers_quantity;
        });
      }
      stats = stats.map((stat) => {
        stat.needs_more_answers = this.quiz.questions.length !== stat.answers_quantity;
        stat.answer_time = stat.answers_quantity ? new Date(stat.last_answer_timestamp / 1000000).toLocaleString() : '';
        return stat;
      });
      this.stats.set(stats);

      index++;
    }

    this.isLoading.set(false);

    this.timer = setInterval(async () => {
      stats = undefined;
      newStats = [];
      index = 0;
      while (stats === undefined || (newStats !== null && newStats.length === VIEW_LIMIT)) {
        newStats = await app.contract.get_quiz_stats({
          quiz_id: this.quizId,
          from_index: index * VIEW_LIMIT,
          limit: VIEW_LIMIT
        });
        if (this.quiz.status === 'Finished') {
          for (let i = 0; i < newStats.length; i++) {
            if (winners.hasOwnProperty(newStats[i].player_id)) {
              newStats[i].reward = winners[newStats[i].player_id].amount + ' ' + this.quiz.tokenTicker;
              newStats[i].claimed = winners[newStats[i].player_id].claimed ? 'Claimed' : 'Not claimed';
            }
          }
        }
        stats = stats ? stats.concat(newStats) : newStats;
        if (stats !== null && stats.length) {
          stats = stats.sort((a, b) => {
            if (b.answers_quantity === a.answers_quantity) {
              return a.last_answer_timestamp - b.last_answer_timestamp;
            }
            return b.answers_quantity - a.answers_quantity;
          });
        }
        stats = stats.map((stat) => {
          stat.needs_more_answers = this.quiz.questions.length !== stat.answers_quantity;
          stat.answer_time = stat.answers_quantity ? new Date(stat.last_answer_timestamp / 1000000).toLocaleString() : '';
          return stat;
        });
        this.stats.set(stats);

        index++;
      }
    }, 30000);
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
  },
  delayed() {
    return Template.instance().delayed;
  }
});

Template.leaderboard.events({

});
