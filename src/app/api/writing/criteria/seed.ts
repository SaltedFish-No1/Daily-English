/**
 * @description 评分标准种子数据 — 当 grading_criteria 表为空时自动写入。
 */

export const CRITERIA_SEED = [
  {
    id: 'ielts_task2',
    label: 'IELTS Task 2',
    description: 'IELTS Academic Writing Task 2: Essay (250 words minimum)',
    grading_prompt:
      "You are a senior IELTS examiner. Grade this Task 2 essay using the official IELTS Writing Band Descriptors.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Response (TR)**: Does the response address all parts of the task? Is the position clear throughout? Are main ideas extended and supported?\n2. **Coherence and Cohesion (CC)**: Is information and ideas logically organized? Is there clear progression throughout? Are cohesive devices used effectively?\n3. **Lexical Resource (LR)**: Is there a wide range of vocabulary? Are less common lexical items used with awareness of style and collocation? Are there spelling errors?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a wide range of structures? Are sentences error-free? Is punctuation accurate?\n\nFor each criterion provide a band score and specific feedback referencing the student's actual text. Identify concrete grammar errors with corrections. Suggest vocabulary upgrades. Write a model answer that would achieve Band 8+.",
    dimensions: [
      {
        key: 'task_response',
        label: 'Task Response',
        maxScore: 9,
        description:
          'Addresses all parts of the task with a clear position, extended and supported ideas',
      },
      {
        key: 'coherence_cohesion',
        label: 'Coherence & Cohesion',
        maxScore: 9,
        description:
          'Logical organization, clear progression, effective use of cohesive devices',
      },
      {
        key: 'lexical_resource',
        label: 'Lexical Resource',
        maxScore: 9,
        description:
          'Wide range of vocabulary, awareness of style and collocation, minimal spelling errors',
      },
      {
        key: 'grammatical_range',
        label: 'Grammatical Range & Accuracy',
        maxScore: 9,
        description:
          'Wide range of structures, error-free sentences, accurate punctuation',
      },
    ],
  },
  {
    id: 'ielts_task1',
    label: 'IELTS Task 1',
    description:
      'IELTS Academic Writing Task 1: Report on visual information (150 words minimum)',
    grading_prompt:
      'You are a senior IELTS examiner. Grade this Task 1 report using the official IELTS Writing Band Descriptors.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Achievement (TA)**: Does the response cover the requirements of the task? Is there a clear overview? Are key features selected and adequately described?\n2. **Coherence and Cohesion (CC)**: Is information logically organized? Is there clear progression? Are referencing and cohesive devices used effectively?\n3. **Lexical Resource (LR)**: Is vocabulary adequate for the task? Are less common words attempted? Are there spelling errors?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a mix of simple and complex sentences? Are grammar and punctuation accurate?\n\nFor each criterion provide a band score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary upgrades. Write a model answer that would achieve Band 8+.',
    dimensions: [
      {
        key: 'task_achievement',
        label: 'Task Achievement',
        maxScore: 9,
        description:
          'Covers task requirements, clear overview, key features selected and described',
      },
      {
        key: 'coherence_cohesion',
        label: 'Coherence & Cohesion',
        maxScore: 9,
        description:
          'Logical organization, clear progression, effective cohesive devices',
      },
      {
        key: 'lexical_resource',
        label: 'Lexical Resource',
        maxScore: 9,
        description:
          'Adequate vocabulary for the task, less common words attempted, minimal spelling errors',
      },
      {
        key: 'grammatical_range',
        label: 'Grammatical Range & Accuracy',
        maxScore: 9,
        description:
          'Mix of simple and complex sentences, accurate grammar and punctuation',
      },
    ],
  },
  {
    id: 'general_essay',
    label: 'General Essay',
    description:
      'General English essay writing practice with flexible criteria',
    grading_prompt:
      'You are an experienced English writing teacher. Grade this essay holistically.\n\nEvaluate on four criteria, each scored 0-10:\n\n1. **Content & Ideas**: Are ideas relevant, well-developed, and supported with examples?\n2. **Organization**: Is there a clear introduction, body, and conclusion? Is the flow logical?\n3. **Language Use**: Is vocabulary varied and appropriate? Are grammar and sentence structures accurate?\n4. **Style & Tone**: Is the writing engaging? Is the tone appropriate for the task?\n\nProvide specific feedback for each criterion. Identify grammar errors with corrections. Suggest vocabulary improvements. Write a model response.',
    dimensions: [
      {
        key: 'content_ideas',
        label: 'Content & Ideas',
        maxScore: 10,
        description: 'Relevant, well-developed ideas supported with examples',
      },
      {
        key: 'organization',
        label: 'Organization',
        maxScore: 10,
        description:
          'Clear structure with introduction, body, conclusion and logical flow',
      },
      {
        key: 'language_use',
        label: 'Language Use',
        maxScore: 10,
        description:
          'Varied vocabulary, accurate grammar and sentence structures',
      },
      {
        key: 'style_tone',
        label: 'Style & Tone',
        maxScore: 10,
        description: 'Engaging writing with appropriate tone for the task',
      },
    ],
  },
  {
    id: 'letter',
    label: 'Letter Writing',
    description: 'Formal or informal letter writing practice',
    grading_prompt:
      'You are an experienced English writing teacher. Grade this letter.\n\nEvaluate on four criteria, each scored 0-10:\n\n1. **Purpose & Content**: Does the letter achieve its purpose? Are all required points addressed?\n2. **Organization & Format**: Does it follow appropriate letter conventions? Is information logically arranged?\n3. **Language & Register**: Is the tone appropriate (formal/informal)? Is vocabulary and grammar suitable?\n4. **Communication Effect**: Would the letter achieve the desired effect on the reader?\n\nProvide specific feedback for each criterion. Identify grammar errors with corrections. Suggest vocabulary improvements. Write a model letter.',
    dimensions: [
      {
        key: 'purpose_content',
        label: 'Purpose & Content',
        maxScore: 10,
        description: 'Achieves purpose, addresses all required points',
      },
      {
        key: 'organization_format',
        label: 'Organization & Format',
        maxScore: 10,
        description:
          'Follows letter conventions, logically arranged information',
      },
      {
        key: 'language_register',
        label: 'Language & Register',
        maxScore: 10,
        description: 'Appropriate tone, suitable vocabulary and grammar',
      },
      {
        key: 'communication_effect',
        label: 'Communication Effect',
        maxScore: 10,
        description: 'Achieves desired effect on the reader',
      },
    ],
  },
  {
    id: 'ielts_gt_task1',
    label: 'IELTS GT Task 1',
    description:
      'IELTS General Training Writing Task 1: Letter (150 words minimum)',
    grading_prompt:
      'You are a senior IELTS examiner. Grade this General Training Task 1 letter using the official IELTS Writing Band Descriptors for GT Task 1.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Achievement (TA)**: Does the letter fully address the task? Is the purpose clear? Is the tone consistent and appropriate?\n2. **Coherence and Cohesion (CC)**: Is the letter logically organized? Is there a natural progression of ideas?\n3. **Lexical Resource (LR)**: Is vocabulary sufficient and appropriate for the letter type?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a mix of simple and complex sentence structures? Are grammar and punctuation accurate?\n\nFor each criterion provide a band score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary upgrades. Write a model letter that would achieve Band 8+.',
    dimensions: [
      {
        key: 'task_achievement',
        label: 'Task Achievement',
        maxScore: 9,
        description:
          'Fully addresses the task, clear purpose, appropriate and consistent tone, all bullet points covered',
      },
      {
        key: 'coherence_cohesion',
        label: 'Coherence & Cohesion',
        maxScore: 9,
        description:
          'Logical paragraph organization, natural progression, effective cohesive devices',
      },
      {
        key: 'lexical_resource',
        label: 'Lexical Resource',
        maxScore: 9,
        description:
          'Sufficient and appropriate vocabulary for letter type, less common words attempted',
      },
      {
        key: 'grammatical_range',
        label: 'Grammatical Range & Accuracy',
        maxScore: 9,
        description:
          'Mix of simple and complex structures, accurate grammar and punctuation',
      },
    ],
  },
  {
    id: 'ielts_gt_task2',
    label: 'IELTS GT Task 2',
    description:
      'IELTS General Training Writing Task 2: Essay (250 words minimum)',
    grading_prompt:
      'You are a senior IELTS examiner. Grade this General Training Task 2 essay using the official IELTS Writing Band Descriptors.\n\nEvaluate strictly on four criteria, each scored 0-9 in 0.5 increments:\n\n1. **Task Response (TR)**: Does the response address all parts of the task? Is the position clear?\n2. **Coherence and Cohesion (CC)**: Is the essay logically organized with clear paragraphing?\n3. **Lexical Resource (LR)**: Is there sufficient range of vocabulary?\n4. **Grammatical Range and Accuracy (GRA)**: Is there a variety of sentence structures?\n\nFor each criterion provide a band score and specific feedback. Identify grammar errors with corrections. Suggest vocabulary upgrades. Write a model essay that would achieve Band 8+.',
    dimensions: [
      {
        key: 'task_response',
        label: 'Task Response',
        maxScore: 9,
        description:
          'Addresses all parts of the task, clear position, extended and supported ideas',
      },
      {
        key: 'coherence_cohesion',
        label: 'Coherence & Cohesion',
        maxScore: 9,
        description:
          'Logical organization with clear paragraphing, effective cohesive devices',
      },
      {
        key: 'lexical_resource',
        label: 'Lexical Resource',
        maxScore: 9,
        description:
          'Sufficient range of vocabulary, precise word use, minimal spelling errors',
      },
      {
        key: 'grammatical_range',
        label: 'Grammatical Range & Accuracy',
        maxScore: 9,
        description:
          'Variety of sentence structures, complex sentences attempted, rare grammatical errors',
      },
    ],
  },
  {
    id: 'toefl_integrated',
    label: 'TOEFL Integrated Writing',
    description:
      'TOEFL iBT Integrated Writing Task: Summarize how the lecture relates to the reading (150-225 words, 20 minutes)',
    grading_prompt:
      'You are a senior TOEFL examiner. Grade this Integrated Writing response using the official ETS TOEFL iBT Integrated Writing Rubric (0-5 scale).\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Content Accuracy & Completeness**: Does the response accurately convey the key points from both the lecture and the reading?\n2. **Organization & Coherence**: Is the response well-organized with a clear structure?\n3. **Language Use**: Is the language generally clear and accurate?\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Write a model response that would score 5.',
    dimensions: [
      {
        key: 'content_accuracy',
        label: 'Content Accuracy & Completeness',
        maxScore: 5,
        description:
          'Accurately conveys key points from both sources, clearly explains relationships',
      },
      {
        key: 'organization_coherence',
        label: 'Organization & Coherence',
        maxScore: 5,
        description:
          'Well-organized structure, effective comparison/contrast, smooth transitions',
      },
      {
        key: 'language_use',
        label: 'Language Use',
        maxScore: 5,
        description:
          'Clear and accurate language, appropriate academic vocabulary, minimal errors',
      },
    ],
  },
  {
    id: 'toefl_independent',
    label: 'TOEFL Independent Writing (Legacy)',
    description:
      'TOEFL iBT Independent Writing Task (Legacy format): Express and support an opinion (300+ words, 30 minutes)',
    grading_prompt:
      'You are a senior TOEFL examiner. Grade this Independent Writing essay using the official ETS TOEFL iBT Independent Writing Rubric (0-5 scale).\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Development & Support**: Is the essay well-developed with clear explanations, examples, and details?\n2. **Organization**: Is there a clear thesis statement? Are body paragraphs well-structured?\n3. **Language Use**: Does the writer demonstrate syntactic variety? Is vocabulary precise?\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Write a model essay that would score 5.',
    dimensions: [
      {
        key: 'development_support',
        label: 'Development & Support',
        maxScore: 5,
        description:
          'Well-developed argument with clear explanations, specific examples, and convincing support',
      },
      {
        key: 'organization',
        label: 'Organization',
        maxScore: 5,
        description:
          'Clear thesis, well-structured paragraphs, effective transitions, unified and coherent',
      },
      {
        key: 'language_use',
        label: 'Language Use',
        maxScore: 5,
        description:
          'Syntactic variety, precise vocabulary, accurate grammar and mechanics',
      },
    ],
  },
  {
    id: 'toefl_academic_discussion',
    label: 'TOEFL Academic Discussion',
    description:
      'TOEFL iBT Writing for an Academic Discussion: Contribute to an online discussion (100+ words, 10 minutes)',
    grading_prompt:
      'You are a senior TOEFL examiner. Grade this Academic Discussion response using the official ETS TOEFL iBT Writing for an Academic Discussion Rubric (0-5 scale).\n\nEvaluate on three criteria, each scored 0-5 in 0.5 increments:\n\n1. **Relevance & Contribution**: Does the response make a relevant and meaningful contribution to the discussion?\n2. **Development & Elaboration**: Is the position clearly explained with specific details?\n3. **Language Use**: Is language clear and effective for academic discussion?\n\nFor each criterion provide a score and specific feedback. Identify grammar errors with corrections. Write a model response that would score 5.',
    dimensions: [
      {
        key: 'relevance_contribution',
        label: 'Relevance & Contribution',
        maxScore: 5,
        description:
          'Relevant and meaningful contribution, clear position, engages with classmates ideas',
      },
      {
        key: 'development_elaboration',
        label: 'Development & Elaboration',
        maxScore: 5,
        description:
          'Well-elaborated position with specific details, examples, and reasoning',
      },
      {
        key: 'language_use',
        label: 'Language Use',
        maxScore: 5,
        description:
          'Clear and effective academic language, precise vocabulary, accurate grammar',
      },
    ],
  },
];
