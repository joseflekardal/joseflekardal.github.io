export class SecretNote {
  $secret: HTMLElement;

  constructor($secretContainer: HTMLElement, index: number) {
    this.$secret = $secretContainer.children[index] as HTMLElement;
  }

  setCorrect(correctAnswer: string) {
    this.$secret.style.backgroundColor = "#43bd73";
    this.$secret.innerText = correctAnswer;
  }

  setIncorrect(correctAnswer: string) {
    this.$secret.style.backgroundColor = "#ff274d";
    this.$secret.classList.remove("animate__bounceIn");
    this.$secret.classList.add("animate__shakeX");
    this.$secret.innerText = correctAnswer;
  }
}

interface Secret {
  new (e: HTMLElement, index: number): SecretNote;
}

export class UI {
  $buttons: HTMLElement[] = [];
  $start: HTMLElement;
  $root: HTMLElement;
  $noteWrapper: HTMLElement;
  $settings: HTMLFormElement;
  $score: HTMLElement;
  $bpmRange: HTMLElement;
  $bpmHeader: HTMLElement;
  $secretContainer: HTMLElement;
  SecretNote: Secret;

  constructor(document: Document, SecretNote: Secret) {
    document.querySelectorAll("#app button").forEach(($btn: HTMLElement) => {
      this.$buttons.push($btn);
    });
    this.$start = document.getElementById("start");
    this.$root = document.getElementById("root");
    this.$noteWrapper = document.getElementById("note-wrapper");
    this.$settings = document.getElementById("settings") as HTMLFormElement;
    this.$score = document.getElementById("score");
    this.$bpmRange = this.$settings.querySelector("input[name=bpm]");
    this.$bpmHeader = document.getElementById("bpm");
    this.$secretContainer = document.getElementById("secrets");

    this.SecretNote = SecretNote;

    this.hookupEventListeners();
  }

  hookupEventListeners() {
    this.$bpmRange.addEventListener("input", (event) => {
      const $el = event.target as HTMLInputElement;
      this.$bpmHeader.innerText = `Speed (${$el.value} bpm)`;
    });
  }

  cleanup() {
    this.$secretContainer.innerHTML = "";
  }

  incrementScore() {
    this.$score.innerText = String(parseInt(this.$score.innerText) + 1);
  }

  decrementScore() {
    this.$score.innerText = String(parseInt(this.$score.innerText) - 1);
  }

  flashButtonByName(chordName: string) {
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

  getSecretByIndex(index: number) {
    return new this.SecretNote(this.$secretContainer, index);
  }

  createSecret() {
    const $secret = document.createElement("span");
    $secret.innerText = "?";
    $secret.classList.add("animate__animated");
    this.$secretContainer.appendChild($secret);
  }

  showSecretByIndex(index: number) {
    this.$secretContainer.children[index].classList.add("animate__bounceIn");
  }

  getUserInput() {
    const formData = new FormData(this.$settings);

    return {
      bpm: Number(formData.get("bpm")),
      numberOfSecretNotes: Number(formData.get("secretNotes")),
      secretType: formData.get("secret").toString(),
      preroll: formData.get("preroll").toString(),
    };
  }

  onAnswer(cb: (s: string) => void) {
    const listener = (event: MouseEvent) => {
      const clickedElement = event.target as HTMLElement;

      if (clickedElement.tagName === "BUTTON") {
        cb(clickedElement.dataset.note);
        this.$noteWrapper.removeEventListener("click", listener);
      }
    };

    this.$noteWrapper.addEventListener("click", listener);
  }
}
