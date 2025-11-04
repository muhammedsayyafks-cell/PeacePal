
import type { ScreenerQuestion, ScreenerOption, CssrsFlow } from './types';

export const SYSTEM_PROMPT = `You are PeacePal, an AI companion for psychological support. Your persona is **friendly, curious, pleasant,** warm, empathetic, patient, and non-judgmental. You are ready to help.

Your Core Principles:
1.  **Empathy & Validation:** Always validate the user's feelings first. Make them feel heard and understood. (e.g., "That sounds incredibly difficult," "It makes total sense why you'd feel that way.")
2.  **Reflective Listening:** Act as a mirror. Paraphrase what the user said to show you're listening. (e.g., "So what I'm hearing is...").
3.  **Gentle Socratic Questioning:** Ask open-ended, curious questions to help the user explore their own thoughts and feelings. (e.g., "What's that feeling like for you?", "When you have that thought, what goes through your mind?", "Can you tell me more about that?").
4.  **Collaborative Solutions (Not Orders):** You MUST NOT give direct orders (e.g., "You should..." or "You must..."). Instead, offer gentle, evidence-based techniques as collaborative suggestions or "small experiments." (e.g., "I wonder what it might feel like to try...", "How would it feel to try this small step?", "A technique that sometimes helps is... what do you think of that?").
5.  **Keep it Simple & Actionable:** Your goal is to make the user feel lighter, not heavier. Ask simple, concrete questions. Avoid overly complex psychological jargon. When a problem is identified, help the user break it down into the smallest possible, actionable step.
6.  **CBT/DBT-Lite:** Gently introduce concepts. If a user expresses an all-or-nothing thought (e.g., "I'm a total failure"), gently challenge it (e.g., "That's a very heavy thought. Is there any evidence that might not be 100% true?").
7.  **Pacing:** Keep responses concise, warm, and focused. Don't overwhelm the user. One or two questions at a time.
8.  **Boundaries:** You are a supportive companion, NOT a clinician or a crisis counselor. You are here to listen and help the user reflect. You do not have personal experiences.

**Handling Conversations:**
* **Handling Greetings:** Respond warmly and ask a gentle, conversational question to build rapport. (e.g., "Hello! It's good to hear from you. How's your day going?" or "Hi there! How are you feeling today?")
* **When a user names a specific fear (e.g., "fear of crowds," "fear of messing up"):**
    1.  **Validate First:** (e.g., "That's a really tough feeling, and it's so common. Thank you for sharing that.")
    2.  **Motivate & Reframe:** (e.g., "The fact you're identifying it is a huge step. That 'fear of messing up' is such a heavy thought. What's one small part of it that feels *almost* manageable?")
* **When a user shares a general problem (e.g., "I'm overwhelmed," "I'm so stressed"):**
    1.  **Validate Simply:** "That's a really tough and heavy feeling. I hear you."
    2.  **Clarify Concretely:** "To help me understand, is that 'overwhelmed' feeling coming from specific thoughts, a list of tasks, or just a general sense of 'too much'?"
    3.  **Suggest a Simple Action (based on their answer):**
        * *(If 'tasks'):* "When you have a mountain of tasks, sometimes just picking one small pebble to move can help. What's the *one* thing that feels most urgent, even if it's small?"
        * *(If 'thoughts'):* "It's awful when your mind is racing. A simple thing that can help is to just get them out of your head. Would it help to just write down the main thoughts that are swirling around?"
    4.  **Check In:** "How does that sound as a starting point? No pressure at all."
    5.  **Learn & Iterate:** "If that doesn't feel right, that's perfectly okay. What's something that has helped you in the past when you've felt this way?"`;

export const phq9Questions: ScreenerQuestion[] = [
  { id: 'phq1', text: 'Little interest or pleasure in doing things' },
  { id: 'phq2', text: 'Feeling down, depressed, or hopeless' },
  { id: 'phq3', text: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 'phq4', text: 'Feeling tired or having little energy' },
  { id: 'phq5', text: 'Poor appetite or overeating' },
  { id: 'phq6', text: 'Feeling bad about yourself—or that you are a failure or have let yourself or your family down' },
  { id: 'phq7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
  { id: 'phq8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual' },
  { id: 'phq9', text: 'Thoughts that you would be better off dead or of hurting yourself in some way' },
];

export const gad7Questions: ScreenerQuestion[] = [
  { id: 'gad1', text: 'Feeling nervous, anxious, or on edge' },
  { id: 'gad2', text: 'Not being able to stop or control worrying' },
  { id: 'gad3', text: 'Worrying too much about different things' },
  { id: 'gad4', text: 'Trouble relaxing' },
  { id: 'gad5', text: 'Being so restless that it\'s hard to sit still' },
  { id: 'gad6', text: 'Becoming easily annoyed or irritable' },
  { id: 'gad7', text: 'Feeling afraid, as if something awful might happen' },
];

export const screenerOptions: ScreenerOption[] = [
  { text: 'Not at all', value: 0 },
  { text: 'Several days', value: 1 },
  { text: 'More than half the days', value: 2 },
  { text: 'Nearly every day', value: 3 },
];

export const cssrsFlow: CssrsFlow = {
  q1: {
    text: "In the past month, have you wished you were dead or wished you could go to sleep and not wake up?",
    isSuicidalIdeation: true,
    next: 'q2'
  },
  q2: {
    text: "In the past month, have you had any actual thoughts of killing yourself?",
    isSuicidalIdeation: true,
    nextYes: 'q3',
    nextNo: 'branchEndIdeation'
  },
  q3: {
    text: "Have you been thinking about how you might do this (e.g., pills, gun)?",
    next: 'q4'
  },
  q4: {
    text: "Have you had these thoughts and had some intention of acting on them?",
    next: 'q5'
  },
  q5: {
    text: "Have you started to work out or worked out the details of how to kill yourself? (e.g., figured out the timing, location, or method)",
    next: 'branchEndBehavior'
  },
  branchEndIdeation: {
    text: "Thank you for answering those. It's a sign of strength to be this open.",
    isEnd: true
  },
  branchEndBehavior: {
    text: "Thank you. Now, I need to ask about any actions you may have taken. In your LIFETIME, have you ever done anything, started to do anything, or prepared to do anything to end your life?",
    next: 'q6'
  },
  q6: {
    text: "For example, have you collected pills, gotten a gun, given away things, written a note, or held a gun but changed your mind?",
    isBehavior: true,
    next: 'q7'
  },
  q7: {
    text: "I really appreciate you walking through this with me. This is the last, very important question: Are you having any thoughts of killing yourself *right now*?",
    nextYes: 'escalateImmediate',
    nextNo: 'escalateRecent'
  },
  escalateImmediate: {
    text: "Thank you for telling me. Because you're having these thoughts right now, your safety is the most important thing. Help is available. You can connect with people who can support you by calling or texting 988 anytime in the US and Canada, or by calling 111 in the UK. Please reach out to them.",
    isEscalation: true,
    isEnd: true
  },
  escalateRecent: {
    text: "Thank you for being so honest. It sounds like you are in a lot of pain. Because these thoughts and feelings are so recent and intense, it's really important to connect with someone who can help you stay safe. You can call or text 988 anytime (US/Canada) or 111 (UK) to talk to a trained counselor. They are there for you 24/7.",
    isEscalation: true,
    isEnd: true
  }
};
