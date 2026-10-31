import { addDoc, collection, getCountFromServer, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { db } from "./firebase.js";

async function initCommunity() {
  const notes = document.querySelector(".community-notes");
  if (!notes) return;

  const showState = (message, loading = false) => {
    const state = document.createElement("p");
    state.className = `community-state${loading ? " is-loading" : ""}`;
    state.setAttribute("role", "status");
    state.textContent = message;
    notes.replaceChildren(state);
    notes.setAttribute("aria-busy", String(loading));
  };

  showState("Loading community commitments…", true);

  try {
    const recentPledges = query(collection(db, "pledges"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(recentPledges);

    const renderedNotes = document.createDocumentFragment();
    snapshot.forEach((pledge) => {
      const data = pledge.data();
      const habit = typeof data.Habit === "string" ? data.Habit.trim() : "";
      if (!habit) return;

      const note = document.createElement("blockquote");
      note.className = "community-note";
      note.append(document.createTextNode(`“${habit}” `));

      const citation = document.createElement("cite");
      const name = data.Anonymous === true || typeof data.Name !== "string" || !data.Name.trim()
        ? "Anonymous"
        : data.Name.trim();
      citation.textContent = `— ${name}`;
      note.append(citation);
      renderedNotes.append(note);
    });

    if (renderedNotes.childNodes.length) {
      notes.replaceChildren(renderedNotes);
      notes.setAttribute("aria-busy", "false");
    } else {
      showState("No community commitments yet. Be the first to share a water-saving habit.");
    }
  } catch (error) {
    console.error("Unable to load recent community pledges.", error);
    showState("Community commitments couldn’t load right now. Please try again later.");
  }
}

function initFactCards() {
  document.querySelectorAll(".fact-card").forEach((card) => {
    const front = card.querySelector(".fact-card-front");
    const back = card.querySelector(".fact-card-back");
    const inner = card.querySelector(".fact-card-inner");
    if (!front || !back || !inner) return;

    const showFace = (showingBack) => {
      card.setAttribute("aria-pressed", String(showingBack));
      front.setAttribute("aria-hidden", String(showingBack));
      back.setAttribute("aria-hidden", String(!showingBack));
    };

    card.addEventListener("click", async () => {
      if (card.dataset.flipping === "true") return;
      const showingBack = card.getAttribute("aria-pressed") !== "true";

      card.dataset.flipping = "true";
      let firstHalf;
      let secondHalf;
      try {
        firstHalf = inner.animate(
          [{ transform: "rotateY(0deg)" }, { transform: "rotateY(90deg)" }],
          { duration: 180, easing: "ease-in", fill: "forwards" },
        );
        await firstHalf.finished;

        inner.style.transform = "rotateY(90deg)";
        firstHalf.cancel();
        showFace(showingBack);
        inner.style.transform = "rotateY(-90deg)";

        secondHalf = inner.animate(
          [{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0deg)" }],
          { duration: 180, easing: "ease-out", fill: "forwards" },
        );
        await secondHalf.finished;
      } finally {
        firstHalf?.cancel();
        secondHalf?.cancel();
        inner.style.transform = "";
        showFace(showingBack);
        delete card.dataset.flipping;
      }
    });
  });
}

function initSavingsCalculator() {
  const slider = document.querySelector("#minutes-slider");
  const minutesValue = document.querySelector(".minutes-value");
  const savings = document.querySelector(".savings-number");
  const bottles = document.querySelector(".bottle-count strong");
  if (!slider || !minutesValue || !savings || !bottles) return;

  const update = () => {
    const minutes = Number(slider.value);
    const liters = minutes * 6 * 365;
    minutesValue.textContent = String(minutes);
    savings.textContent = `${liters.toLocaleString("en-US")} liters`;
    bottles.textContent = Math.round(liters / 1.5).toLocaleString("en-US");
  };

  slider.addEventListener("input", update);
  update();
}

function ordinal(value) {
  const lastTwoDigits = value % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function initPledgeForm() {
  const form = document.querySelector(".pledge-form");
  const errorMessage = document.querySelector(".pledge-error");
  const success = document.querySelector(".pledge-success");
  const countMessage = document.querySelector(".pledge-count");
  if (!form || !errorMessage || !success || !countMessage) return;

  const nameInput = form.querySelector("#pledge-name");
  const anonymousInput = form.querySelector("[name='anonymous']");
  const nameCounter = form.querySelector("#pledge-name-count");
  const habitInput = form.querySelector("#pledge-habit");
  const habitCounter = form.querySelector("#pledge-habit-count");
  const updateCounter = (input, counter) => {
    if (!input || !counter) return;
    counter.textContent = `${input.value.length} / ${input.maxLength}`;
  };
  nameInput?.addEventListener("input", () => updateCounter(nameInput, nameCounter));
  habitInput?.addEventListener("input", () => updateCounter(habitInput, habitCounter));
  updateCounter(nameInput, nameCounter);
  updateCounter(habitInput, habitCounter);
  const updateAnonymousState = () => {
    if (!nameInput || !anonymousInput) return;
    nameInput.disabled = anonymousInput.checked;
    form.classList.toggle("is-anonymous", anonymousInput.checked);
  };
  anonymousInput?.addEventListener("change", updateAnonymousState);
  updateAnonymousState();

  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const habit = String(formData.get("habit") ?? "").trim();
    const anonymous = formData.has("anonymous");
    if (!anonymous && !name) {
      showError("Enter your name or choose to stay anonymous.");
      form.querySelector("#pledge-name")?.focus();
      return;
    }
    if (!habit) {
      showError("Describe the water-saving change you are making at home.");
      form.querySelector("#pledge-habit")?.focus();
      return;
    }

    errorMessage.hidden = true;
    const submitButton = form.querySelector(".pledge-submit");
    if (submitButton) submitButton.disabled = true;

    try {
      await addDoc(collection(db, "pledges"), {
        Name: anonymous ? "Anonymous" : name,
        Habit: habit,
        Anonymous: anonymous,
        Commitment: formData.has("commitment"),
        createdAt: serverTimestamp(),
      });
      await initCommunity();

      let committedCount = null;
      try {
        const countSnapshot = await getCountFromServer(collection(db, "pledges"));
        committedCount = countSnapshot.data().count;
      } catch (countError) {
        console.error("Unable to read the Firestore pledge count.", countError);
      }

      form.hidden = true;
      success.hidden = false;
      success.classList.add("is-visible");
      countMessage.textContent = committedCount === null
        ? "Your message is posted. Thank you for leaving a message."
        : `Your message is posted. It is the ${ordinal(committedCount)} submission.`;
    } catch (error) {
      console.error("Unable to save pledge to Firestore.", error);
      showError("Your pledge could not be saved. Please check your connection and try again.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

export function initPageInteractions() {
  initFactCards();
  initSavingsCalculator();
  initCommunity();
  initPledgeForm();
}
