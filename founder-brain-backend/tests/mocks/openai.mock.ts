export const mockMeetingExtraction = {
  decisions: ['Approved the new design', 'Hired a new developer'],
  tasks: [
    { task: 'Complete the dashboard', owner: 'John', deadline: '2024-05-01' },
    { task: 'Update the docs', owner: null, deadline: null }
  ],
  summary: 'A productive meeting about product development.'
};

export const mockAIService = {
  processMeetingNotes: jest.fn().mockResolvedValue(mockMeetingExtraction),
  extractMentionedPeople: jest.fn().mockReturnValue(['John']),
};
