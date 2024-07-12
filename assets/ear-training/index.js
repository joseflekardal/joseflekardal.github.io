import { UI, SecretNote } from "./lib";

const CONFIG = {
  subdivision: "4n",
  transpose: 0,
};
let state = {};

const ui = new UI(document, SecretNote);

const data = {
  chords: [
    { name: "C", notes: ["C2", "E4", "G4", "C5"] },
    { name: "Dm7", notes: ["D2", "F4", "A4", "C5"] },
    { name: "Em7", notes: ["E2", "D4", "G4", "B4"] },
    { name: "F", notes: ["F2", "F4", "A4", "C5"] },
    { name: "G", notes: ["G2", "D4", "G4", "B4"] },
    { name: "Am7", notes: ["A2", "E4", "G4", "C5"] },
    { name: "G/B", notes: ["B2", "D4", "G4", "B4"] },
  ],
  singles: [
    { name: "C4", notes: ["C4"] },
    { name: "D4", notes: ["D4"] },
    { name: "E4", notes: ["E4"] },
    { name: "F4", notes: ["F4"] },
    { name: "G4", notes: ["G4"] },
    { name: "A4", notes: ["A4"] },
    { name: "B4", notes: ["B4"] },
    { name: "C5", notes: ["C5"] },
  ],
  pause: { note: null },
  stop: { stop: true },
};

const sequences = {
  all: data.singles,
  root: data.singles.slice(0, 1),
  none: [],
};

function getSecret(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function transpose(offset) {
  return (note) => Tone.Frequency(note).transpose(offset);
}

function getAnswer() {
  return new Promise((resolve) => {
    ui.onAnswer(resolve);
  });
}

async function playSequence(time, chord) {
  if (chord.stop) {
    t.stop(time + Tone.Time("8n").toSeconds());

    for (const [index, secret] of Object.entries(state.secrets)) {
      const answer = await getAnswer();

      const currentSecret = ui.getSecretByIndex(index);

      if (answer !== secret.name) {
        synth.triggerAttackRelease(["Bb3", "B3"], "8n");

        currentSecret.setIncorrect(secret.name);
        ui.decrementScore();
      } else {
        currentSecret.setCorrect(answer);
        ui.incrementScore();
      }
    }

    setTimeout(run, 1000);
  } else if (chord.notes) {
    synth.triggerAttackRelease(
      chord.notes.map(transpose(CONFIG.transpose)),
      CONFIG.subdivision,
      time
    );

    if (!chord.secret) {
      Tone.Draw.schedule(ui.flashButtonByName(chord.name), time);
    } else {
      Tone.Draw.schedule(() => {
        ui.showSecretByIndex(state.secrets.indexOf(chord));
      }, time);
    }
  } else {
    Tone.Draw.schedule(ui.flashButtonByName(), time);
  }
}

const t = Tone.getTransport();

const synth = new Tone.PolySynth().toDestination();

const seq = new Tone.Sequence(playSequence, [], CONFIG.subdivision).start(0);

seq.loop = false;

function run() {
  const settings = ui.getUserInput();

  state = {
    ...settings,
    secrets: [],
  };

  t.bpm.value = settings.bpm;

  ui.$start.disabled = true;

  ui.cleanup();

  let i = 0;
  while (i++ < state.numberOfSecretNotes) {
    const secret = getSecret(data[state.secretType]);
    state.secrets.push({ ...secret, secret: true });

    ui.createSecret();
  }

  seq.events = [...sequences[state.preroll]];

  if (seq.events.length) {
    seq.events.push(data.pause, data.pause);
  }

  seq.events.push(...state.secrets, data.stop);

  t.start();
}

ui.$start.addEventListener("mousedown", run);

ui.$root.addEventListener("mousedown", () => {
  synth.triggerAttackRelease(data.singles[0].notes, CONFIG.subdivision);
});

ui.$secretContainer.addEventListener("mousedown", (event) => {
  const $el = event.target;
  if ($el.tagName === "SPAN") {
    const arrIndex = Array.from(ui.$secretContainer.children).indexOf($el);

    synth.triggerAttackRelease(
      state.secrets[arrIndex].notes,
      CONFIG.subdivision
    );
  }
});
