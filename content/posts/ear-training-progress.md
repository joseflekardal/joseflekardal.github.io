+++
title = 'Ear Training Progress'
date = 2024-05-30T13:03:17+02:00
draft = false
categories = ['Dev']
+++

### Finally some updates on the ear training app

Time for some blogging, I've updated the [ear training app]({{< ref "/ear-training" >}}). As much as I like hand rolling stuff I decided to use [ToneJS](https://tonejs.github.io/) moving forward. The main feature that was kind of hard to do elegant was updating the ui when notes were played, this is a breeze using tonejs!

<!--more-->

At first I didn't quite get how to use tonejs, it is a somewhat large library with a lot of features. Everything started coming together when I started using the Sequence api rather than manually scheduling notes on the timeline:

```js
// create an instrument
const synth = new Tone.PolySynth().toDestination();

// create the actual sequence
const seq = new Tone.Sequence(
  (time, notes) => {
    synth.triggerAttackRelease(notes, time);
  },
  ["C4", "E4", "G4", "C5"], // these notes will be fed into the callback above, one by one using the provided subdivision:
  "8n"
).start(0);

const transport = Tone.getTransport();

// play it
transport.start();
```

Using the sequence api allowed me to quickly add functionality for secret chords instead of only single notes. I believe that I now have a good foundation to add any features that comes to mind.

Something that I want to build is the option to select what chords and notes in a scale to use as secrets. And speaking about scales, that would also be a cool feature, prebuild scales and maybe option to store user scales.. Also, users should be able to store their own chords.

I also wanna keep adding simpler settings such as selecting a different synth sound, maybe some wave files, a user might be able to upload her own sounds..

Still a lot of stuff to do, also the ui is still very untouched!
