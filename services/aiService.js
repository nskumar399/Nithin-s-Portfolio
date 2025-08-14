const OpenAI = require('openai');
const config = require('../config/config');
const logger = require('./logger');

class AIService {
  constructor() {
    if (!config.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not provided. AI features will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
    }
  }

  // Check if AI service is available
  isAvailable() {
    return this.openai !== null;
  }

  // Generate design suggestions based on project description
  async generateDesignSuggestions(projectDescription, category = 'mechanical') {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    try {
      const prompt = this.buildDesignSuggestionPrompt(projectDescription, category);
      
      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert mechanical engineer and CAD designer. Provide practical, detailed suggestions for mechanical design projects."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const suggestions = this.parseAISuggestions(response.choices[0].message.content);
      
      logger.info('AI design suggestions generated successfully');
      return suggestions;
    } catch (error) {
      logger.error('Failed to generate AI design suggestions:', error);
      throw new Error('Failed to generate design suggestions');
    }
  }

  // Analyze CAD design for optimization opportunities
  async analyzeDesignOptimization(projectData) {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    try {
      const prompt = this.buildOptimizationPrompt(projectData);
      
      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert in design optimization, manufacturing processes, and material science. Analyze mechanical designs for optimization opportunities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1200
      });

      const optimizations = this.parseOptimizationAnalysis(response.choices[0].message.content);
      
      logger.info('AI design optimization analysis completed');
      return optimizations;
    } catch (error) {
      logger.error('Failed to analyze design optimization:', error);
      throw new Error('Failed to analyze design optimization');
    }
  }

  // Validate design based on engineering principles
  async validateDesign(designSpecs) {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    try {
      const prompt = this.buildValidationPrompt(designSpecs);
      
      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a senior design validation engineer. Identify potential issues, safety concerns, and compliance problems in mechanical designs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      });

      const validationResults = this.parseValidationResults(response.choices[0].message.content);
      
      logger.info('AI design validation completed');
      return validationResults;
    } catch (error) {
      logger.error('Failed to validate design:', error);
      throw new Error('Failed to validate design');
    }
  }

  // Generate material recommendations
  async recommendMaterials(designRequirements) {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    try {
      const prompt = this.buildMaterialRecommendationPrompt(designRequirements);
      
      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a materials engineer with expertise in mechanical properties, manufacturing processes, and cost optimization."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 800
      });

      const materials = this.parseMaterialRecommendations(response.choices[0].message.content);
      
      logger.info('AI material recommendations generated');
      return materials;
    } catch (error) {
      logger.error('Failed to generate material recommendations:', error);
      throw new Error('Failed to generate material recommendations');
    }
  }

  // Build prompt for design suggestions
  buildDesignSuggestionPrompt(description, category) {
    return `
Project Description: ${description}
Category: ${category}

Please provide 3-5 specific design suggestions for this ${category} project. For each suggestion, include:
1. A clear title
2. Detailed description of the suggestion
3. Potential benefits
4. Implementation considerations
5. Estimated impact on project success (0-1 scale)

Format your response as structured suggestions that can be easily parsed.
    `;
  }

  // Build prompt for optimization analysis
  buildOptimizationPrompt(projectData) {
    return `
Project: ${projectData.name}
Description: ${projectData.description}
Category: ${projectData.category}
Current Material: ${projectData.metadata?.material || 'Not specified'}
Dimensions: ${projectData.metadata?.dimensions ? 
      `${projectData.metadata.dimensions.length}x${projectData.metadata.dimensions.width}x${projectData.metadata.dimensions.height} ${projectData.metadata.dimensions.unit}` 
      : 'Not specified'}

Analyze this design for optimization opportunities in:
1. Material efficiency
2. Manufacturing processes
3. Cost reduction
4. Performance improvement
5. Sustainability

Provide specific, actionable recommendations with confidence levels.
    `;
  }

  // Build prompt for design validation
  buildValidationPrompt(designSpecs) {
    return `
Design Specifications:
${JSON.stringify(designSpecs, null, 2)}

Validate this design for:
1. Structural integrity
2. Safety considerations
3. Manufacturing feasibility
4. Standards compliance
5. Potential failure modes

Identify any critical issues, warnings, or recommendations for improvement.
    `;
  }

  // Build prompt for material recommendations
  buildMaterialRecommendationPrompt(requirements) {
    return `
Design Requirements:
- Application: ${requirements.application || 'General mechanical'}
- Load conditions: ${requirements.loadConditions || 'Not specified'}
- Environment: ${requirements.environment || 'Standard'}
- Budget constraint: ${requirements.budget || 'Medium'}
- Manufacturing method: ${requirements.manufacturing || 'Not specified'}

Recommend 3-5 suitable materials with:
1. Material name and type
2. Key properties
3. Advantages for this application
4. Disadvantages or limitations
5. Relative cost (Low/Medium/High)
6. Availability and sourcing considerations
    `;
  }

  // Parse AI suggestions response
  parseAISuggestions(content) {
    // This is a simplified parser - in a real implementation,
    // you might want more sophisticated parsing
    const suggestions = [];
    const sections = content.split(/\d+\./);
    
    sections.slice(1).forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        suggestions.push({
          type: 'suggestion',
          title: lines[0].trim(),
          content: lines.slice(1).join('\n').trim(),
          confidence: 0.8, // Default confidence
          generatedAt: new Date()
        });
      }
    });

    return suggestions;
  }

  // Parse optimization analysis response
  parseOptimizationAnalysis(content) {
    const optimizations = [];
    const sections = content.split(/\d+\./);
    
    sections.slice(1).forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        optimizations.push({
          type: 'optimization',
          title: lines[0].trim(),
          content: lines.slice(1).join('\n').trim(),
          confidence: 0.75,
          generatedAt: new Date()
        });
      }
    });

    return optimizations;
  }

  // Parse validation results
  parseValidationResults(content) {
    const validations = [];
    const sections = content.split(/\d+\./);
    
    sections.slice(1).forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        validations.push({
          type: 'validation',
          title: lines[0].trim(),
          content: lines.slice(1).join('\n').trim(),
          confidence: 0.85,
          generatedAt: new Date()
        });
      }
    });

    return validations;
  }

  // Parse material recommendations
  parseMaterialRecommendations(content) {
    const materials = [];
    const sections = content.split(/\d+\./);
    
    sections.slice(1).forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        materials.push({
          name: lines[0].trim(),
          description: lines.slice(1).join('\n').trim(),
          recommended: true
        });
      }
    });

    return materials;
  }
}

module.exports = new AIService();