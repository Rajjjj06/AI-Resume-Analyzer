const PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      resumes: 5,
      jobs: 5,
      interview_questions: 5,
    },
  },
  pro: {
    name: "Pro",
    price: 20000, // ₹200 in paise
    limits: {
      resumes: 15,
      jobs: 15,
      interview_questions: 20,
    },
  },
  pro_plus: {
    name: "Pro+",
    price: 50000, // ₹500 in paise
    limits: {
      resumes: Infinity,
      jobs: Infinity,
      interview_questions: Infinity,
    },
  },
};

export default PLANS;
