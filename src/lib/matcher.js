/**
 * Calculates a match score (0 - 100) between a student's profile and an internship's requirements.
 * 
 * @param {Array<string>} studentSkills - List of skills the student has
 * @param {string} studentBio - Student's self-description
 * @param {Array<string>} requiredSkills - List of skills the internship requires
 * @param {string} internshipDescription - Detailed description of the internship
 * @returns {number} Match score between 0 and 100
 */
export function calculateMatchScore(studentSkills = [], studentBio = '', requiredSkills = [], internshipDescription = '') {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 100; // If no skills are required, it's a 100% match
  }

  // Normalize all strings to lowercase for comparison
  const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
  const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());
  const normalizedBio = (studentBio || '').toLowerCase();
  const normalizedDesc = (internshipDescription || '').toLowerCase();

  let matchedRequiredSkillsCount = 0;
  
  // 1. Direct Skill Matches (Weights 70% of the total score)
  normalizedRequiredSkills.forEach(reqSkill => {
    // Check if the student explicitly listed the skill
    if (normalizedStudentSkills.includes(reqSkill)) {
      matchedRequiredSkillsCount++;
    } 
    // Check if the skill is mentioned in the student's bio
    else if (normalizedBio.includes(reqSkill)) {
      matchedRequiredSkillsCount++;
    }
  });

  const skillMatchPercentage = (matchedRequiredSkillsCount / normalizedRequiredSkills.length) * 100;

  // 2. Extra Student Skills mentioned in Internship Description (Weights 20% of total score)
  let extraMatches = 0;
  const nonRequiredStudentSkills = normalizedStudentSkills.filter(
    s => !normalizedRequiredSkills.includes(s)
  );

  if (nonRequiredStudentSkills.length > 0) {
    nonRequiredStudentSkills.forEach(skill => {
      if (normalizedDesc.includes(skill)) {
        extraMatches++;
      }
    });
  }
  
  const extraMatchBonus = nonRequiredStudentSkills.length > 0 
    ? Math.min((extraMatches / nonRequiredStudentSkills.length) * 20, 20)
    : 0;

  // 3. Keyword / Context Overlaps (Weights 10% of total score)
  // Let's check common industry keywords overlap
  let contextScore = 0;
  const relevantKeywords = ['internship', 'development', 'design', 'engineering', 'analytics', 'management', 'project', 'team', 'creative', 'software'];
  let keywordMatches = 0;
  relevantKeywords.forEach(kw => {
    if (normalizedBio.includes(kw) && normalizedDesc.includes(kw)) {
      keywordMatches++;
    }
  });
  contextScore = (keywordMatches / relevantKeywords.length) * 10;

  // 4. Combine and Cap
  let totalScore = Math.round((skillMatchPercentage * 0.7) + extraMatchBonus + contextScore);
  
  // Bound between 0 and 100, but let's give a baseline of 15 if there's any text match
  if (totalScore > 100) totalScore = 100;
  if (totalScore < 0) totalScore = 0;
  if (totalScore === 0 && (normalizedStudentSkills.length > 0 || normalizedBio.length > 0)) {
    // If they have completed their profile, give them a small baseline score (e.g., 20%)
    totalScore = 20;
  }

  return totalScore;
}
