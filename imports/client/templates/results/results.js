import './results.css';
import './results.html';
import { Template } from 'meteor/templating';
import { dummyData } from '../game/game';

const throwConfettis = () => {
  import confetti from 'canvas-confetti';

  confetti({
    particleCount: 200,
    spread: 100,
  });
};

const quiz = dummyData['1'];

// With real data we would pass the quiz info here, and then set as the template state.
Template.results.onCreated(function () {
  throwConfettis();
});
Template.results.helpers({
  quiz,
});
Template.results.events({
  'click #leaderboard-button': (event, instance) => {
    import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

    // state.get('_id')
    FlowRouter.go('leaderboardRoute', { quizId: quiz.quizId });
  },
  'click #claim-button': (event, instance) => {},
});
