import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import RulebaseModel from '@/models/rulebase.model';

// Ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    try {
      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI as string);
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw new Error('Database connection failed');
    }
  }
}

export async function GET() {
  try {
    console.log('🚀 GET /api/rulebase - Starting request');
    await ensureDbConnection();
    
    // Fetch all rules from MongoDB
    const rules = await RulebaseModel.find({ active: true })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${rules.length} rules`);
    
    // Transform rules to match frontend interface
    const transformedRules = rules.map((rule: any) => ({
      _id: rule._id.toString(),
      name: rule.name,
      description: rule.description || '',
      tags: rule.tags || [],
      sourceType: rule.sourceType,
      fileName: rule.fileName,
      active: rule.active,
      updatedAt: rule.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({ rules: transformedRules });
  } catch (error) {
    console.error('❌ GET /api/rulebase error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch rules',
      rules: [] 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log('🚀 POST /api/rulebase - Starting request');
    await ensureDbConnection();
    
    const body = await req.json();
    console.log('POST body:', body);
    
    const { name, description = '', tags = [], sourceType = 'text', active = true } = body || {};
    
    if (!name || typeof name !== 'string') {
      console.log('❌ POST error: Invalid name');
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    
    // Create new rule in MongoDB
    const newRule = new RulebaseModel({
      name,
      description,
      tags: Array.isArray(tags) ? tags : [],
      sourceType,
      active: active !== false,
    });
    
    const savedRule = await newRule.save();
    console.log('✅ Rule created:', savedRule._id);
    
    // Transform for frontend
    const rule = {
      _id: savedRule._id.toString(),
      name: savedRule.name,
      description: savedRule.description || '',
      tags: savedRule.tags || [],
      sourceType: savedRule.sourceType,
      active: savedRule.active,
      updatedAt: savedRule.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('❌ POST error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    console.log('🚀 PATCH /api/rulebase - Starting request');
    await ensureDbConnection();
    
    const body = await req.json();
    console.log('PATCH body:', body);
    
    const { id, active, name, description, tags } = body || {};
    
    if (!id) {
      console.log('❌ PATCH error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    // Prepare update object
    const updateData: any = { updatedAt: new Date() };
    if (typeof active === 'boolean') updateData.active = active;
    if (typeof name === 'string') updateData.name = name;
    if (typeof description === 'string') updateData.description = description;
    if (Array.isArray(tags)) updateData.tags = tags;
    
    // Update rule in MongoDB
    const updatedRule = await RulebaseModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, lean: true }
    );
    
    if (!updatedRule) {
      console.log('❌ PATCH error: Rule not found for id:', id);
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    console.log('✅ Rule updated:', (updatedRule as any)._id);
    
    // Transform for frontend
    const rule = {
      _id: (updatedRule as any)._id.toString(),
      name: (updatedRule as any).name,
      description: (updatedRule as any).description || '',
      tags: (updatedRule as any).tags || [],
      sourceType: (updatedRule as any).sourceType,
      fileName: (updatedRule as any).fileName,
      active: (updatedRule as any).active,
      updatedAt: (updatedRule as any).updatedAt.toISOString(),
    };
    
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('❌ PATCH error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    console.log('🚀 DELETE /api/rulebase - Starting request');
    await ensureDbConnection();
    
    const body = await req.json().catch(() => ({}));
    console.log('DELETE body:', body);
    
    const { id } = body || {};
    
    if (!id) {
      console.log('❌ DELETE error: id is required');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    // Soft delete by setting active to false
    const deletedRule = await RulebaseModel.findByIdAndUpdate(
      id,
      { $set: { active: false, updatedAt: new Date() } },
      { new: true }
    );
    
    if (!deletedRule) {
      console.log('❌ DELETE error: Rule not found for id:', id);
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    console.log('✅ Rule soft deleted:', deletedRule._id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('❌ DELETE error:', e);
    return NextResponse.json({ 
      error: 'Bad request', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 400 });
  }
}

