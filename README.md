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

- [Create new quizes](#creating-a-quiz)
- [Invite users to solve a quiz](#solving-a-quiz)
- [Check the leaderboards](#leaderboards)

If you're curious, you can find a deployed Quiz Chain example at https://testnet.quizchain.org/

### Creating a quiz

To create a quiz, visit `http://<your-quiz-site>/create`. (See a [live demo here](https://testnet.quizchain.org/create))

> Note: if you haven't logged in, visit `http://<your-quiz-site>/` and log in with your [NEAR wallet](https://wallet.testnet.near.org/)

<img width="651" alt="Create Quiz" src="https://user-images.githubusercontent.com/1153055/138516736-32457c93-8982-4ab9-b85e-df73125068b5.png">

Next, fill out the "Create new quiz" form:

- Title
- Description
- Language
- Quiz type
- Questions
- Rewards

Once you complete the form, click on the <kbd>Create Quiz</kbd> button and save the data (e.g., `[{"selected_option_ids":[1]}]`) to manage the quiz later.
After you click the button, you'll be redirected to the Wallet to complete the transfer of the quiz's reward.

> Tip: you can find your newly created quiz under your profile (`http://<your-quiz-site>/profile`).

### Solving a quiz

To solve a quiz and win a prize, visit `http://<your-quiz-site>/quiz/<quiz-number>`. (See a [live demo here](https://testnet.quizchain.org/quiz/15))

> Note: if you haven't logged in, visit `http://<your-quiz-site>/` and log in with your [NEAR wallet](https://wallet.testnet.near.org/)

<img width="560" alt="Solve a quiz" src="https://user-images.githubusercontent.com/1153055/138518068-e2bdbfda-7954-487e-be40-435ed99cae9d.png">

Once you solve the quiz, if you're the winner you'll be able to claim the reward by clicking on the <kbd>Claim Prize</kbd> button. 

<img width="476" alt="claim prize" src="https://user-images.githubusercontent.com/1153055/138523227-fc260280-2847-42f4-9f07-d562f1b8d8cf.png">

By claiming a prize, you'll be redirected to the NEAR wallet, to confirm the token transfer.

### Leaderboards

If you want to check the leaderboard for a quiz, visit `http://<your-quiz-site>/leaderboard/<quiz-number>`. (See a [live demo here](https://testnet.quizchain.org/leaderboard/5))

<img width="570" alt="leaderboard" src="https://user-images.githubusercontent.com/1153055/138521732-091a38a3-5e0f-4405-b0ee-4b5378fbb146.png">

