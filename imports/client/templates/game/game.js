import './game.html';
import './game.css';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

const dummyData = {
  1: {
    quizName: 'Geography Quiz',
    quizId: '1',
    quizCta: 'First 5 persons get 20 NEAR each',
    questions: [
      {
        title: 'Question 1 testing testing',
        options: [
          {
            value:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam feugiat bibendum eleifend. In aliquam, leo a facilisis rutrum, ligula nulla eleifend tellus, ut euismod libero mi sed lorem. Morbi pharetra sapien eu maximus consequat. Ut convallis eget nisi eget tempus. Phasellus eleifend sollicitudin velit, quis sagittis enim rutrum et. Vivamus malesuada mi mattis nunc lobortis tincidunt. Curabitur iaculis, nibh vel volutpat blandit, leo leo blandit nisi, non lacinia sem nisl ac ligula. Aenean et velit ullamcorper lacus facilisis egestas. Etiam leo turpis, dapibus eget consectetur eu, rhoncus nec arcu. Ut vehicula enim velit, id mattis justo iaculis sit amet. Nam facilisis urna ex, nec fermentum tortor sodales sed. Nunc id augue et elit mattis tincidunt nec at leo. Donec a luctus enim. Donec nec nisl faucibus, ultrices ante et, vehicula ligula. Nulla non eleifend eros, sit amet luctus mi.',
            isCorrect: false,
            number: 1,
          },
          {
            value:
              ' us sed nec nulla. Duis varius sollicitudin nisi, ac semper nulla scelerisque a. Donec hendrerit velit quis libero suscipit, ut consectetur urna accumsan. Proin nec tortor a nibh ultricies dictum quis eu lectus. Curabitur vel sapien sed ante sagittis pharetra vitae eu erat.',
            isCorrect: true,
            number: 2,
          },
          {
            value: 'Option 3 DASIDJAOIDJIOAJDAJIOD',
            isCorrect: false,
            number: 3,
          },
        ],
      },
      {
        title: 'Question2 testing testing',
        options: [
          { value: 'option 1', isCorrect: false, number: 1 },
          { value: 'option 2', isCorrect: true, number: 2 },
          { value: 'option 3', isCorrect: false, number: 3 },
        ],
      },
      {
        title: 'Question 3 testing testing',
        options: [
          { value: 'option 1', isCorrect: false, number: 1 },
          { value: 'option 2', isCorrect: true, number: 2 },
          { value: 'option 3', isCorrect: false, number: 3 },
        ],
      },
    ],
  },
};

Template.game.onCreated(function () {
  import { ReactiveDict } from 'meteor/reactive-dict';

  const instance = Template.instance();

  this.state = new ReactiveDict();
  this.state.setDefault({
    quizId: instance?.data.params.quizId,
    currentQuestionNumber: 0,
    currentAnswer: null,
  });
});

const getNumberForPercentage = () => {
  const currentQuestionNumber = Template.instance().state.get(
    'currentQuestionNumber'
  );
  return currentQuestionNumber > 0 ? parseInt(currentQuestionNumber) + 1 : 1;
};

const getCurrentQuiz = () => dummyData[Template.instance().state.get('quizId')];

Template.game.helpers({
  dummyData,
  quiz: getCurrentQuiz,
  getNumberForPercentage: () =>
    `${getNumberForPercentage()}/${getCurrentQuiz().questions.length}`,
  progressBarPercentage: () => {
    const questionNumber = getNumberForPercentage();
    const maxValue = getCurrentQuiz().questions.length;

    if (!maxValue || !questionNumber) return null;
    if (questionNumber > maxValue) {
      throw new Meteor.Error('Current question is bigger than max value');
    }

    return Math.floor((100 / maxValue) * questionNumber);
  },
  currentQuestion: () =>
    getCurrentQuiz().questions[
      Template.instance().state.get('currentQuestionNumber')
    ],
  answers: () =>
    getCurrentQuiz().questions[
      Template.instance().state.get('currentQuestionNumber')
    ].options,
});

Template.game.events({
  'click li > input': (event, instance) => {
    // Code to correctly submit the answer to the API will go here.
    // For now, just move to the next question or to the home page.
    import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
    import $ from 'jquery';
    // const selectedAnswer = Template.instance().state.get('currentAnswer');

    const actualQuestionNumber = instance.state.get('currentQuestionNumber');
    const numberOfQuestions = getCurrentQuiz().questions.length;
    if (actualQuestionNumber < numberOfQuestions - 1) {
      Template.instance().state.set(
        'currentQuestionNumber',
        actualQuestionNumber + 1
      );
      $(':radio').prop('checked', false);
      return;
    }

    FlowRouter.go('/');
  },
});
