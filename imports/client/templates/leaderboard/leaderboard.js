import './leaderboard.css';
import './leaderboard.html';
import { Template } from 'meteor/templating';

Template.leaderboard.helpers({
  players: [
    { name: 'Player1', results: '1/10' },
    { name: 'Player2', results: '6/10' },
    { name: 'Player3', results: '10/10', reward: '10 NEAR' },
    { name: 'Player1', results: '1/10' },
    { name: 'Player2', results: '6/10' },
    { name: 'Player3', results: '10/10', reward: '10 NEAR' },
    { name: 'Player1', results: '1/10' },
    { name: 'Player2', results: '6/10' },
    { name: 'Player3', results: '10/10', reward: '10 NEAR' },
    { name: 'Player1', results: '1/10' },
    { name: 'Player2', results: '6/10' },
    { name: 'Player3', results: '10/10', reward: '10 NEAR' },
    { name: 'Player1', results: '1/10' },
    { name: 'Player2', results: '6/10' },
    { name: 'Player3', results: '10/10', reward: '10 NEAR' },
  ],
});

Template.leaderboard.events({
  'click #join-button': (event, instance) => {
    import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

    FlowRouter.go('gameRoute', { quizId: 1 });
  },
});
