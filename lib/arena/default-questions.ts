import { QuizBattleQuestion } from "./types";

export const DEFAULT_QUIZ_BATTLE_QUESTIONS: QuizBattleQuestion[] = [
  {
    id: "q1",
    question: "Which lentil is the primary ingredient used to make traditional South Indian Medu Vada?",
    options: ["Urad Dal (Black Gram)", "Chana Dal (Bengal Gram)", "Toor Dal (Pigeon Pea)", "Moong Dal (Green Gram)"],
    correctIndex: 0,
    explanation: "Medu Vada is traditionally made from soaked and ground white urad dal, creating its signature crispy exterior and fluffy interior.",
  },
  {
    id: "q2",
    question: "What unique traditional brewing technique gives Madras Filter Coffee its frothy top?",
    options: ["Espresso steam wand", "Pouring back and forth in a Davarah & Tumbler", "Electric milk frother", "French press plunger"],
    correctIndex: 1,
    explanation: "Pouring the hot coffee back and forth between the tumbler and davarah aerates the mixture, creating the rich, authentic froth.",
  },
  {
    id: "q3",
    question: "Which spice provides the golden yellow color and earthiness to traditional Sambar?",
    options: ["Saffron", "Turmeric (Haldi)", "Mustard Seeds", "Kashmiri Chili"],
    correctIndex: 1,
    explanation: "Turmeric along with freshly ground coriander and fenugreek gives Sambar its golden hue and aromatic flavor profile.",
  },
  {
    id: "q4",
    question: "What gives Rava Dosa its unique crispy, lacy texture compared to regular fermented dosas?",
    options: ["Semolina (Sooji) and rice flour batter", "Corn starch slurry", "Baking powder", "Thick gram flour paste"],
    correctIndex: 0,
    explanation: "Rava Dosa is made from an unfermented batter of semolina (rava), rice flour, and cumin poured on a piping hot tawa.",
  },
  {
    id: "q5",
    question: "In South Indian dining etiquette, how is a fresh banana leaf traditionally placed before a diner?",
    options: ["Tapered tip pointing to the left", "Tapered tip pointing to the right", "Wide end pointing up", "Direction does not matter"],
    correctIndex: 0,
    explanation: "Traditionally, the banana leaf is placed with its tapered tip pointing to the diner's left, with salt and pickles served on the top left.",
  },
  {
    id: "q6",
    question: "Which South Indian state is famous for the fragrant Chettinad cuisine known for black peppercorns and star anise?",
    options: ["Kerala", "Tamil Nadu", "Karnataka", "Andhra Pradesh"],
    correctIndex: 1,
    explanation: "Chettinad cuisine originates from the Chettinad region of Sivaganga district in southern Tamil Nadu.",
  },
  {
    id: "q7",
    question: "What key ingredient gives tamarind rice (Puliyodharai) its signature tangy flavor?",
    options: ["Kokum", "Raw Mango", "Tamarind Pulp", "Amchur powder"],
    correctIndex: 2,
    explanation: "Thick tamarind pulp (puli) simmered with sesame oil, jaggery, and roasted spices gives Puliyodharai its authentic taste.",
  },
  {
    id: "q8",
    question: "Which traditional sweet made from pure ghee, gram flour, and sugar originated in the royal kitchens of Mysore Palace?",
    options: ["Mysore Pak", "Tirupati Laddu", "Payasam", "Jalebi"],
    correctIndex: 0,
    explanation: "Mysore Pak was created in 1935 by royal chef Kakasura Madappa in the kitchens of the Mysore Palace.",
  },
];
