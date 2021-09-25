import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Home page
FlowRouter.route('/', {
  title: 'Home',
  action() {},
});

// Leaderboard
FlowRouter.route('/leaderboard/:quizId', {
  title: 'Leaderboard',
  action() {},
});

// Results
FlowRouter.route('/results/:quizId', {
  title: 'Results',
  action() {},
});

// My profile
FlowRouter.route('/my-profile', {
  title: 'My profile',
  action() {},
});

// Game
FlowRouter.route('/game/:quizId/:questionNumber', {
  title: 'Game',
  action() {},
});

// 404 route (catch all)
FlowRouter.route('*', {
  title: '404: Page not found',
  action() {},
});
