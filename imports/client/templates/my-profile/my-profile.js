import {app} from '/imports/client/app.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import './my-profile.css';
import './my-profile.html';

const VIEW_LIMIT_OWNER = 100;
const VIEW_LIMIT_PLAYER = 50;

Template.myProfile.onCreated(function () {
  this.isLoading = new ReactiveVar(true);
  this.isPendingOperation = new ReactiveVar(false);
  this.quizzesByUser = new ReactiveVar([]);
  this.quizzesByOwner = new ReactiveVar([]);
  let userData;
  let ownerData;

  if (!app._account) {
    FlowRouter.go('home');
  }

  (async () => {
    ownerData = await app.contract.get_quizzes_by_owner({
      account_id: app._account.accountId,
      from_index: 0,
      limit: VIEW_LIMIT_OWNER
    });

    if (ownerData) {
      ownerData = ownerData.map(quiz => {
        quiz.id_str = quiz.id.toString();
        quiz.is_revealed_answers = quiz.revealed_answers !== null && quiz.revealed_answers.length > 0;
        quiz.tokenTicker = app.tokens_account_ids[quiz.token_account_id || ''].name;

        quiz.myRewardToClaim = 0;
        quiz.myRewardClaimed = 0;
        quiz.distributed_rewards.map(reward => {
          if (reward.winner_account_id === app._account.accountId) {
            if (reward.claimed) {
              quiz.myRewardClaimed += app.convertAmount(reward.amount, quiz.token_account_id, 'fromBlockchain');
            } else {
              quiz.myRewardToClaim += app.convertAmount(reward.amount, quiz.token_account_id, 'fromBlockchain');
            }
          }
        });

        quiz.timestamp_diff_days = Math.ceil((new Date()).getTime() - quiz.timestamp / 1000000) / 1000 / 3600 / 24;
        if (quiz.status === 'InProgress' && quiz.timestamp_diff_days > 5) {
          quiz.allow_cancel = true;
        }

        return quiz;
      });
      let uniqueIds = [];
      ownerData = ownerData.filter(quiz => {
        if (!uniqueIds.includes(quiz.id)) {
          uniqueIds.push(quiz.id);
          return true;
        }
        return false;
      });

      ownerData.reverse();
      this.quizzesByOwner.set(ownerData);
    }

    userData = await app.contract.get_quizzes_by_player({
      account_id: app._account.accountId,
      from_index: 0,
      limit: VIEW_LIMIT_PLAYER
    });
    if (userData) {
      userData = userData.map(quiz => {
        quiz.id_str = quiz.id.toString();
        quiz.is_revealed_answers = quiz.revealed_answers !== null && quiz.revealed_answers.length > 0;
        return quiz;
      });
      userData.reverse();
      this.quizzesByUser.set(userData);
    }

    this.isLoading.set(false);
  })();
});

Template.myProfile.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  isPendingOperation() {
    return Template.instance().isPendingOperation.get();
  },
  quizzesByUser() {
    return Template.instance().quizzesByUser.get();
  },
  isQuizzesByUser() {
    return Template.instance().quizzesByUser.get().length > 0;
  },
  quizzesByOwner() {
    return Template.instance().quizzesByOwner.get();
  },
  isQuizzesByOwner() {
    return Template.instance().quizzesByOwner.get().length > 0;
  }
});

Template.myProfile.events({
  'click [data-get-users-with-hash]'(e, template) {
    e.preventDefault();
    try {
      const parent = e.target.closest('.reveal-hash-box');
      let quizId = parseInt(parent.getAttribute('data-quiz-id'));
      let successHash = parent.getElementsByClassName('input-success-hash')[0].value.trim();
      if (successHash) {
        template.isPendingOperation.set(true);
        app.contract.get_users_with_final_hash({
          quiz_id: quizId,
          hash: successHash
        }).then((users) => {
          let html;
          if (users) {
            html = `<div class="mt-2">Total users with the same hash: ${users.length}</div>`;
            if (users.length) {
              html += '<ul>' + users.map(user => `<li>${user}</li>`).join('') + '</ul>';
            }
          } else {
            html = '<div class="mt-2">No winners yet...</div>';
          }
          parent.getElementsByClassName('users-with-same-hash')[0].innerHTML = html;
          template.isPendingOperation.set(false);
        });
      } else {
        alert('Success Hash missing');
      }
    } catch (err) {
      console.error('[data-reveal-hash] ERROR:', err);
    }
    return false;
  },
  'click [data-reveal-hash]'(e, template) {
    e.preventDefault();
    try {
      const parent = e.target.closest('.reveal-hash-box');
      let quizId = parseInt(parent.getAttribute('data-quiz-id'));
      let successHash = parent.getElementsByClassName('input-success-hash')[0].value.trim();
      if (successHash) {
        template.isPendingOperation.set(true);
        app.contract.reveal_final_hash({
          quiz_id: quizId,
          hash: successHash
        }, app.claimGas, 1).then(() => template.isPendingOperation.set(false));
      } else {
        alert('Success Hash is missing');
      }
    } catch (err) {
      console.error('[data-reveal-hash] ERROR:', err);
    }
    return false;
  },
  'click [data-reveal-answers]'(e, template) {
    e.preventDefault();
    try {
      const parent = e.target.closest('.reveal-answers-box');
      let quizId = parseInt(parent.getAttribute('data-quiz-id'));
      let answers = JSON.parse(parent.getElementsByClassName('input-answers')[0].value.trim());
      if (answers) {
        template.isPendingOperation.set(true);
        app.contract.reveal_answers({
          quiz_id: quizId,
          revealed_answers: answers
        }, app.claimGas, 1).then(() => template.isPendingOperation.set(false));
      } else {
        alert('Answers are missing');
      }
    } catch (err) {
      console.error('[data-reveal-answer] ERROR:', err);
    }
    return false;
  },
  'click [data-logout]'(e) {
    e.preventDefault();
    app.wallet.signOut();
    window.location.href = '/';
    return false;
  }
});
