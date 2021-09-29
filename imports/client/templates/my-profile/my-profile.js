import { Template } from 'meteor/templating';
// import { Session } from 'meteor/session';
import './my-profile.html';
import './my-profile.css';

// Template.myProfile.onCreated(function () {
//   Session.set('showSubtitle', false);
// });

// Here we would fetch the quiz name, reward and etc from the quizId.
const dummyUser = {
  name: 'Dummy User',
  scores: [
    {
      quizId: '1',
      quizName: 'Testing 123',
      quizReward: '10 NEAR',
      answered: 5,
      claimed: false,
      isFinished: false,
    },
    {
      quizId: '2',
      quizName: 'Testing 123',
      quizReward: '50 NEAR',
      answered: 6,
      claimed: false,
      isFinished: false,
    },
    {
      quizId: '3',
      quizName: 'Testing 123',
      quizReward: '10 DAI',
      answered: 10,
      claimed: true,
      isFinished: true,
    },
  ],
};
Template.myProfile.helpers({
  userData: dummyUser,
  shouldBeAbleToClaim: ({ isFinished, claimed }) => isFinished && !claimed,
});

Template.myProfile.events({
  'click #claim-badge-button': () => alert('Hello!'),
});
