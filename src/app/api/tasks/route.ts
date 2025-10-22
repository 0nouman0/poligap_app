import { NextRequest, NextResponse } from 'next/server';
import { GraphQLService, extractNodes } from '@/lib/graphql-service';

// GET /api/tasks - Fetch all tasks for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const gqlService = new GraphQLService();
    await gqlService.init();

    // Fetch tasks using GraphQL
    const response: any = await gqlService.query('getTasks', { userId });
    const data = extractNodes(response.tasksCollection);

    // Transform to frontend format
    const tasks = data.map(task => ({
      _id: task.id,
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      assignee: task.assignee,
      category: task.category,
      source: task.source,
      sourceRef: task.source_ref,
      userId: task.user_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      status = 'pending',
      priority = 'medium',
      dueDate,
      assignee,
      category,
      source = 'compliance',
      sourceRef,
      userId
    } = body;

    if (!title || !userId) {
      return NextResponse.json(
        { success: false, error: 'Title and User ID are required' },
        { status: 400 }
      );
    }

    const gqlService = new GraphQLService();
    await gqlService.init();

    // Create task using GraphQL
    const response: any = await gqlService.query('createTask', {
      title,
      description,
      status,
      priority,
      due_date: dueDate,
      assignee,
      category,
      source,
      source_ref: sourceRef || {},
      user_id: userId
    });
    
    const data = response.insertIntotasksCollection.records[0];

    // Transform response to match expected format
    const task = {
      _id: data.id,
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date,
      assignee: data.assignee,
      category: data.category,
      source: data.source,
      sourceRef: data.source_ref,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - Update an existing task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      status,
      priority,
      dueDate,
      assignee,
      category
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const gqlService = new GraphQLService();
    await gqlService.init();

    const variables: any = { id };
    if (title !== undefined) variables.title = title;
    if (description !== undefined) variables.description = description;
    if (status !== undefined) variables.status = status;
    if (priority !== undefined) variables.priority = priority;
    if (dueDate !== undefined) variables.due_date = dueDate;
    if (assignee !== undefined) variables.assignee = assignee;
    if (category !== undefined) variables.category = category;

    // Update task using GraphQL
    const response: any = await gqlService.query('updateTask', variables);
    const data = response.updatetasksCollection.records[0];

    // Transform response
    const task = {
      _id: data.id,
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date,
      assignee: data.assignee,
      category: data.category,
      source: data.source,
      sourceRef: data.source_ref,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks - Update an existing task (alternative format with updates object)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const gqlService = new GraphQLService();
    await gqlService.init();

    const variables: any = { id };
    if (updates.title !== undefined) variables.title = updates.title;
    if (updates.description !== undefined) variables.description = updates.description;
    if (updates.status !== undefined) variables.status = updates.status;
    if (updates.priority !== undefined) variables.priority = updates.priority;
    if (updates.dueDate !== undefined) variables.due_date = updates.dueDate;
    if (updates.assignee !== undefined) variables.assignee = updates.assignee;
    if (updates.category !== undefined) variables.category = updates.category;

    // Update task using GraphQL
    const response: any = await gqlService.query('updateTask', variables);
    const data = response.updatetasksCollection.records[0];

    // Transform response
    const task = {
      _id: data.id,
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date,
      assignee: data.assignee,
      category: data.category,
      source: data.source,
      sourceRef: data.source_ref,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const gqlService = new GraphQLService();
    await gqlService.init();

    // Delete task using GraphQL
    await gqlService.query('deleteTask', { id });

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
