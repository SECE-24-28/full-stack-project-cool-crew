import { calculateMatchScore } from '../src/lib/matcher.js';

console.log('--- RUNNING AI MATCHING ENGINE TESTS ---\n');

const tests = [
  {
    name: '1. Perfect Match',
    studentSkills: ['React', 'NodeJS', 'MongoDB'],
    studentBio: 'Passionate about full-stack development, React and databases.',
    requiredSkills: ['React', 'NodeJS', 'MongoDB'],
    internshipDesc: 'Looking for a full stack engineer skilled in React and NodeJS to build MongoDB applications.',
  },
  {
    name: '2. Partial Match',
    studentSkills: ['React', 'CSS'],
    studentBio: 'UI designer with React experience.',
    requiredSkills: ['React', 'NodeJS', 'MongoDB'],
    internshipDesc: 'Looking for a full stack developer with NodeJS, React and MongoDB skills.',
  },
  {
    name: '3. Mismatch / Low Match',
    studentSkills: ['Photoshop', 'Figma'],
    studentBio: 'Graphic designer focused on visual design.',
    requiredSkills: ['Python', 'Docker', 'Kubernetes'],
    internshipDesc: 'Looking for a DevOps engineer who knows Python scripting, Docker, and Kubernetes.',
  },
  {
    name: '4. Skill in Bio Overlap',
    studentSkills: ['Figma'],
    studentBio: 'UI Designer familiar with React and CSS styling.',
    requiredSkills: ['React', 'CSS'],
    internshipDesc: 'Web designer internship focusing on UI/UX, React, and CSS layout builds.',
  }
];

tests.forEach((test) => {
  const score = calculateMatchScore(
    test.studentSkills,
    test.studentBio,
    test.requiredSkills,
    test.internshipDesc
  );
  console.log(`Test: ${test.name}`);
  console.log(`- Student Skills:  [${test.studentSkills.join(', ')}]`);
  console.log(`- Required Skills: [${test.requiredSkills.join(', ')}]`);
  console.log(`- Computed Score:  \x1b[36m${score}%\x1b[0m`);
  console.log('--------------------------------------');
});
