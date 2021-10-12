import {app} from '/imports/client/app.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import './my-profile.html';

Template.myProfile.onCreated(function () {
  this.isLoading = new ReactiveVar(true);
  this.isPendingOperation = new ReactiveVar(false);
  this.quizzesByUser = new ReactiveVar([]);
  let data;

  if (!app._account) {
    FlowRouter.go('home');
  }

  (async () => {
    data = await app.contract.get_quizzes_by_owner({
      account_id: app._account.accountId,
      from_index: 0,
      limit: 20
    });
    if (data) {
      data = data.map(quiz => {
        quiz.is_revealed_answers = quiz.revealed_answers !== null && quiz.revealed_answers.length > 0;
        return quiz;
      });
      this.quizzesByUser.set(data);
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
          let html = `<div class="mt-2">Total users with the same hash: ${users.length}</div>`;
          if (users.length) {
            html += '<ul>' + users.map(user => `<li>${user}</li>`) + '</ul>';
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
