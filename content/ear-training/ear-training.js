const CONFIG = {
  subdivision: "4n",
  transpose: 0,
};
let state = {};

const $buttons = Array.from(document.querySelectorAll("#app button"));
const $start = document.getElementById("start");
const $root = document.getElementById("root");
const $noteWrapper = document.getElementById("note-wrapper");
const $settings = document.getElementById("settings");
const $score = document.getElementById("score");
const $bpmRange = $settings.querySelector("input[name=bpm]");
const $bpmHeader = document.getElementById("bpm");
const $secrets = document.getElementById("secrets");

$bpmRange.addEventListener("input", (event) => {
  $bpmHeader.innerText = `Speed (${event.target.value} bpm)`;
});

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

    $noteWrapper.addEventListener(
      "click",
      (event) => {
        const clickedElement = event.target;

        if (clickedElement.tagName === "BUTTON") {
          resolve(clickedElement.dataset.note);
        }
      },
      { once: true }
    );
  });
}

async function playSequence(time, chord) {
  if (chord.stop) {
    t.stop(time + Tone.Time("8n").toSeconds());

    for (const [index, secret] of Object.entries(state.secrets)) {
      const answer = await getAnswer();
      const $current = $secrets.children[index];

      if (answer !== secret.name) {
        $current.style.backgroundColor = "#ff274d";
        $current.classList.remove("animate__bounceIn");
        $current.classList.add("animate__shakeX");
        $current.innerText = secret.name;

        console.log(state.secrets.map((s) => s.name).join(", "), answer);

        synth.triggerAttackRelease(["Bb3", "B3"], "8n");
        $score.innerText = parseInt($score.innerText) - 1;
      } else {
        $current.style.backgroundColor = "#43bd73";
        $current.innerText = answer;
        $score.innerText = parseInt($score.innerText) + 1;
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
      Tone.Draw.schedule(flashByName(chord.name), time);
    } else {
      $secrets.children[state.secrets.indexOf(chord)].classList.add(
        "animate__bounceIn"
      );
    }
  } else {
    Tone.Draw.schedule(flashByName(), time);
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

  const settingsForm = new FormData($settings);

  state = {
    bpm: Number(settingsForm.get("bpm")),
    numberOfSecretNotes: Number(settingsForm.get("secretNotes")),
    secretType: settingsForm.get("secret"),
    preroll: settingsForm.get("preroll"),
    secrets: [],
    cleanupPendingAnswer: null,
  };

  t.bpm.value = state.bpm;

  $secrets.innerHTML = "";

  let i = 0;
  while (i++ < state.numberOfSecretNotes) {
    const secret = getSecret(data[state.secretType]);
    state.secrets.push({ ...secret, secret: true });

    const $secret = document.createElement("span");
    $secret.innerText = "?";
    $secret.classList.add("animate__animated");
    $secrets.appendChild($secret);
  }

  seq.events = [...sequences[state.preroll]];

  if (seq.events.length) {
    seq.events.push(data.pause, data.pause);
  }

  seq.events.push(...state.secrets, data.stop);

  // synth.triggerAttackRelease(Tone.Frequency('A4').harmonize([0, 4, 7]), '2n')

  t.start();
}

$start.addEventListener("mousedown", run);

$root.addEventListener("mousedown", () => {
  synth.triggerAttackRelease(data.singles[0].notes, CONFIG.subdivision);
});

$secrets.addEventListener("mousedown", (event) => {
  const $el = event.target;
  if ($el.tagName === "SPAN") {
    const arrIndex = Array.from($secrets.children).indexOf($el);

    synth.triggerAttackRelease(
      state.secrets[arrIndex].notes,
      CONFIG.subdivision
    );
  }
});
