const story = require('./test.json');

const responses = {};

async function test(dialog) {
	for (const state of dialog) {
		if (state.choices) {
			const choices = state.choices.map((c, i) => (i + 1) + '. ' + c).join('\n');
			console.log(choices);
			const choice = await awaitResponse(state.choices.length, 1000);
			responses[state.id] = choice - 1;
			state.say = state.choices[choice - 1];
		} else if (state.requirements !== undefined) {
			let enter = false;
			for (let requirement of state.requirements) {
				const response = responses[requirement.id];
				enter = response === requirement.is;
				if (!enter) break;
			}

			if (!enter) {
				continue;
			} else if (state.dialog) {
				await test(state.dialog);
				continue;
			}
		}
		console.log(state.character + ': ' + state.say);
		await sleep(state.ms || 1000);
	}
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function awaitResponse(max, ms) {
	await new Promise(resolve => setTimeout(resolve, ms || 1000));
	return Math.floor(Math.random() * max) + 1;
}

test(story.dialog);