import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import RulebaseModel from '@/models/rulebase.model';

// Sample rules to populate the database
const sampleRules = [
  {
    name: "GDPR Compliance Rules",
    description: "General Data Protection Regulation compliance requirements for data processing and user consent.",
    tags: ["GDPR", "privacy", "data-protection", "EU"],
    sourceType: "text",
    active: true,
  },
  {
    name: "HIPAA Security Standards",
    description: "Health Insurance Portability and Accountability Act security standards for healthcare data.",
    tags: ["HIPAA", "healthcare", "security", "PHI"],
    sourceType: "text", 
    active: true,
  },
  {
    name: "SOX Financial Controls",
    description: "Sarbanes-Oxley Act financial reporting and internal controls requirements.",
    tags: ["SOX", "financial", "controls", "reporting"],
    sourceType: "text",
    active: true,
  },
  {
    name: "PCI DSS Payment Security",
    description: "Payment Card Industry Data Security Standard for handling credit card information.",
    tags: ["PCI-DSS", "payments", "security", "credit-cards"],
    sourceType: "text",
    active: true,
  },
  {
    name: "ISO 27001 Information Security",
    description: "ISO 27001 information security management system requirements and controls.",
    tags: ["ISO-27001", "information-security", "ISMS", "controls"],
    sourceType: "text",
    active: true,
  },
  {
    name: "CCPA Privacy Rights",
    description: "California Consumer Privacy Act requirements for consumer privacy rights and data handling.",
    tags: ["CCPA", "privacy", "california", "consumer-rights"],
    sourceType: "text",
    active: true,
  },
  {
    name: "Company Code of Conduct",
    description: "Internal company policies for employee behavior, ethics, and professional standards.",
    tags: ["internal", "ethics", "conduct", "policies"],
    sourceType: "file",
    fileName: "code_of_conduct.pdf",
    active: true,
  },
  {
    name: "Data Retention Policy",
    description: "Guidelines for data retention periods, archival procedures, and secure deletion practices.",
    tags: ["data-retention", "archival", "deletion", "lifecycle"],
    sourceType: "text",
    active: true,
  }
];

export async function POST() {
  try {
    console.log('🌱 Seeding rulebase with sample data...');
    
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // Check if rules already exist
    const existingCount = await RulebaseModel.countDocuments();
    if (existingCount >= sampleRules.length) {
      console.log(`📊 Database already has ${existingCount} rules`);
      return NextResponse.json({ 
        message: `Database already contains ${existingCount} rules`,
        seeded: false 
      });
    }

    // Insert sample rules
    const createdRules = await RulebaseModel.insertMany(sampleRules);
    
    console.log(`✅ Successfully seeded ${createdRules.length} sample rules`);
    
    return NextResponse.json({ 
      message: `Successfully seeded ${createdRules.length} sample rules`,
      seeded: true,
      rules: createdRules.map(rule => ({
        _id: rule._id.toString(),
        name: rule.name,
        tags: rule.tags
      }))
    });

  } catch (error) {
    console.error('❌ Error seeding rulebase:', error);
    return NextResponse.json({ 
      error: 'Failed to seed rulebase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
