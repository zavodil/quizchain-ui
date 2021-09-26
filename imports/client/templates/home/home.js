import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import './home.css';
import './home.html';

const dummyData = [
  {
    _id: 1,
    name: 'aaa',
    reward: '100 NEAR',
    cta: 'First 5 winners get X points each',
  },
  {
    _id: 2,
    name: 'aaa',
    reward: '100 NEAR',
    cta: 'First 5 winners get Y points each',
  },
  {
    _id: 3,
    name: 'aaa',
    reward: '100 NEAR',
    cta: 'First 5 winners get Z points each',
  },
];

const getCurrentQuizSelected = () =>
  Template.instance()?.state.get('selectedQuiz');
const hasAnyQuizSelected = () => !!getCurrentQuizSelected();

Template.home.onCreated(function () {
  import { ReactiveDict } from 'meteor/reactive-dict';

  this.state = new ReactiveDict();
  this.state.setDefault({
    selectedQuiz: null,
  });
});

Template.home.helpers({
  showMoreButton: true,
  dummyData,
  selectedQuiz: () => hasAnyQuizSelected() && getCurrentQuizSelected(),
  showHelpText: () => Meteor.user() && !hasAnyQuizSelected(),
  activeClass: ({ _id }) =>
    hasAnyQuizSelected() && _id === getCurrentQuizSelected()._id
      ? 'active'
      : '',
});

Template.home.events({
  'click .quiz-row'(event, instance) {
    if (!Meteor.user()) return;
    if (!this) throw new Meteor.Error('No context found.');
    instance.state.set('selectedQuiz', this);
  },
});
