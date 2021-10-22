# Quiz Chain

NEAR Protocol-powered quizzes with crypto-prizes

## Install dependencies

1. Make sure you have installed [meteor.js](https://www.meteor.com/developers/install)
2. Install the project's NPM dependencies: `meteor npm install`

## Running locally

```shell
# NEAR TESTNET
meteor --settings=settings-testnet.json
```

## How to update

1. `ssh` to the server
2. `cd /home/appuser`
3. `./deploy.sh -bmpr near-quiz-chain-main`

## Using the Quiz Chain app

Once you have deployed the Quiz Chain app, you will be able to:

- Create new quizes
- Invite users to solve a quiz
- Check the leaderboards

If you're curious, you can find a deployed Quiz Chain example at https://testnet.quizchain.org/

### Creating a quiz

To create a quiz, visit `http://<your-quiz-site>/create`. (See a [live demo here](https://testnet.quizchain.org/create))

<img width="751" alt="Create Quiz" src="https://user-images.githubusercontent.com/1153055/138516736-32457c93-8982-4ab9-b85e-df73125068b5.png">

> Note: if you haven't logged in, visit `http://<your-quiz-site>/` and log in with your [NEAR wallet](https://wallet.testnet.near.org/)

Next, fill out the "Create new quiz" form:

- Title
- Description
- Language
- Quiz type
- Questions
- Rewards

Next, click on the <kbd>Create Quiz</kbd> button and save the data (e.g., `[{"selected_option_ids":[1]}]`) to manage the quiz later.
After you click the button, you'll be redirected to the Wallet to complete the transfer of the quiz reward.

### Solving a quiz

### Leaderboard
