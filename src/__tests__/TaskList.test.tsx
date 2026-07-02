import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
	{
		id: 1,
		title: 'Première tâche',
		description: 'Description 1',
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Deuxième tâche',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

// Default handlers, overridable per test.
const defaultProps = {
	onToggle: vi.fn(),
	onDelete: vi.fn(),
	onEdit: vi.fn(),
};

describe('TaskList', () => {
	it('shows loading state', () => {
		render(
			<TaskList tasks={[]} loading={true} error={null} {...defaultProps} />,
		);

		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
	});

	it('shows error state when an error is provided', () => {
		render(
			<TaskList
				tasks={[]}
				loading={false}
				error="Connexion impossible"
				{...defaultProps}
			/>,
		);

		expect(screen.getByTestId('error')).toBeInTheDocument();
		expect(
			screen.getByText('Erreur : Connexion impossible'),
		).toBeInTheDocument();
	});

	it('prioritizes loading over error', () => {
		render(
			<TaskList
				tasks={[]}
				loading={true}
				error="Connexion impossible"
				{...defaultProps}
			/>,
		);

		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.queryByTestId('error')).not.toBeInTheDocument();
	});

	it('shows empty state when there are no tasks', () => {
		render(
			<TaskList tasks={[]} loading={false} error={null} {...defaultProps} />,
		);

		expect(screen.getByTestId('empty')).toBeInTheDocument();
		expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
		expect(
			screen.getByText('Commencez par ajouter votre première tâche !'),
		).toBeInTheDocument();
	});

	it('renders list of tasks with plural counts', () => {
		render(
			<TaskList
				tasks={mockTasks}
				loading={false}
				error={null}
				{...defaultProps}
			/>,
		);

		expect(screen.getByTestId('task-list')).toBeInTheDocument();
		expect(screen.getByText('Première tâche')).toBeInTheDocument();
		expect(screen.getByText('Deuxième tâche')).toBeInTheDocument();
		expect(screen.getByText('2 tâches')).toBeInTheDocument();
		expect(screen.getByText('1 terminée')).toBeInTheDocument();
	});

	it('uses singular labels for a single unfinished task', () => {
		const single: Task[] = [{ ...mockTasks[0], completed: false }];

		render(
			<TaskList tasks={single} loading={false} error={null} {...defaultProps} />,
		);

		expect(screen.getByText('1 tâche')).toBeInTheDocument();
		expect(screen.getByText('0 terminée')).toBeInTheDocument();
	});

	it('pluralizes the completed count when several tasks are done', () => {
		const allDone: Task[] = [
			{ ...mockTasks[0], completed: true },
			{ ...mockTasks[1], completed: true },
		];

		render(
			<TaskList tasks={allDone} loading={false} error={null} {...defaultProps} />,
		);

		expect(screen.getByText('2 tâches')).toBeInTheDocument();
		expect(screen.getByText('2 terminées')).toBeInTheDocument();
	});

	it('renders one TaskItem wrapper per task', () => {
		const { container } = render(
			<TaskList
				tasks={mockTasks}
				loading={false}
				error={null}
				{...defaultProps}
			/>,
		);

		expect(container.querySelectorAll('.task-item-wrapper')).toHaveLength(
			mockTasks.length,
		);
	});
});