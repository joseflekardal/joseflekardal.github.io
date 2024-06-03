const CONFIG = {
  subdivision: "4n",
  transpose: 0,
};
let state = {};

class UI {
  constructor(document, SecretNote) {
    this.$buttons = Array.from(document.querySelectorAll("#app button"));
    this.$start = document.getElementById("start");
    this.$root = document.getElementById("root");
    this.$noteWrapper = document.getElementById("note-wrapper");
    this.$settings = document.getElementById("settings");
    this.$score = document.getElementById("score");
    this.$bpmRange = this.$settings.querySelector("input[name=bpm]");
    this.$bpmHeader = document.getElementById("bpm");
    this.$secretContainer = document.getElementById("secrets");

    this.SecretNote = SecretNote;

    this.hookupEventListeners();
  }

  hookupEventListeners() {
    this.$bpmRange.addEventListener("input", (event) => {
      this.$bpmHeader.innerText = `Speed (${event.target.value} bpm)`;
    });
  }

  cleanup() {
    this.$secretContainer.innerHTML = "";
  }

  incrementScore() {
    this.$score.innerText = parseInt(this.$score.innerText) + 1;
  }

  decrementScore() {
    this.$score.innerText = parseInt(this.$score.innerText) - 1;
  }

  flashButtonByName(chordName) {
    return () => {
      this.$buttons.forEach(($btn) => {
        if (chordName && $btn.dataset.note === chordName) {
          $btn.classList.add("highlight");
        } else {
          $btn.classList.remove("highlight");
        }
      });
    };
  }

  getSecretByIndex(index) {
    return new this.SecretNote(this.$secretContainer, index);
  }

  createSecret() {
    const $secret = document.createElement("span");
    $secret.innerText = "?";
    $secret.classList.add("animate__animated");
    this.$secretContainer.appendChild($secret);
  }

  showSecretByIndex(index) {
    this.$secretContainer.children[index].classList.add("animate__bounceIn");
  }

  getUserInput() {
    const formData = new FormData(this.$settings);

    return {
      bpm: Number(formData.get("bpm")),
      numberOfSecretNotes: Number(formData.get("secretNotes")),
      secretType: formData.get("secret"),
      preroll: formData.get("preroll"),
    };
  }

  onAnswer(cb) {
    this.$noteWrapper.addEventListener(
      "click",
      (event) => {
        const clickedElement = event.target;

        if (clickedElement.tagName === "BUTTON") {
          cb(clickedElement.dataset.note);
        }
      },
      { once: true }
    );
  }
}

class SecretNote {
  constructor($secretContainer, index) {
    this.$secret = $secretContainer.children[index];
  }

  setCorrect(correctAnswer) {
    this.$secret.style.backgroundColor = "#43bd73";
    this.$secret.innerText = correctAnswer;
  }

  setIncorrect(correctAnswer) {
    this.$secret.style.backgroundColor = "#ff274d";
    this.$secret.classList.remove("animate__bounceIn");
    this.$secret.classList.add("animate__shakeX");
    this.$secret.innerText = correctAnswer;
  }
}

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

function flashByName(chordName) {
  return () => {
    $buttons.forEach(($btn) => {
      if (chordName && $btn.dataset.note === chordName) {
        $btn.classList.add("highlight");
      } else {
        $btn.classList.remove("highlight");
      }
    });
  };
}

function transpose(offset) {
  return (note) => Tone.Frequency(note).transpose(offset);
}

function getAnswer() {
  return new Promise((resolve, reject) => {
    state.cleanupPendingAnswer = reject;

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
  if (state.cleanupPendingAnswer) {
    state.cleanupPendingAnswer();
  }

  const settings = ui.getUserInput();

  state = {
    ...settings,
    secrets: [],
    cleanupPendingAnswer: null,
  };

  t.bpm.value = settings.bpm;

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
