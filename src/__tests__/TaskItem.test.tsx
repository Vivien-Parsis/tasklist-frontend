import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const baseTask: Task = {
	id: 42,
	title: 'Ma tâche',
	description: 'Une description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

function renderItem(task: Partial<Task> = {}, handlers = {}) {
	const props = {
		task: { ...baseTask, ...task },
		onToggle: vi.fn(),
		onDelete: vi.fn(),
		onEdit: vi.fn(),
		...handlers,
	};
	render(<TaskItem {...props} />);
	return props;
}

describe('TaskItem', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	describe('display', () => {
		it('renders the title, description and an unchecked checkbox', () => {
			renderItem();

			expect(screen.getByText('Ma tâche')).toBeInTheDocument();
			expect(screen.getByText('Une description')).toBeInTheDocument();
			expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(
				false,
			);
		});

		it('omits the description when it is null', () => {
			renderItem({ description: null });

			expect(screen.queryByText('Une description')).not.toBeInTheDocument();
		});

		it('marks completed tasks with the completed class and a checked box', () => {
			renderItem({ completed: true });

			expect(screen.getByTestId('task-item').className).toContain(
				'task-completed',
			);
			expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(
				true,
			);
		});

		it('adapts the checkbox aria-label to the completion state', () => {
			renderItem({ completed: true });

			expect(
				screen.getByLabelText('Marquer "Ma tâche" comme non terminée'),
			).toBeInTheDocument();
		});
	});

	describe('toggle', () => {
		it('calls onToggle with the task id when the checkbox changes', () => {
			const props = renderItem();

			fireEvent.click(screen.getByRole('checkbox'));

			expect(props.onToggle).toHaveBeenCalledWith(42);
		});
	});

	describe('inline edit', () => {
		it('switches to the edit form with current values when clicking edit', () => {
			renderItem();

			fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

			expect(
				(screen.getByLabelText('Modifier le titre') as HTMLInputElement).value,
			).toBe('Ma tâche');
			expect(
				(screen.getByLabelText('Modifier la description') as HTMLTextAreaElement)
					.value,
			).toBe('Une description');
		});

		it('saves the edited values and exits edit mode', () => {
			const props = renderItem();

			fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
			fireEvent.change(screen.getByLabelText('Modifier le titre'), {
				target: { value: '  Nouveau titre  ' },
			});
			fireEvent.change(screen.getByLabelText('Modifier la description'), {
				target: { value: '' },
			});
			fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

			expect(props.onEdit).toHaveBeenCalledWith(42, {
				title: 'Nouveau titre',
				description: undefined,
			});
			expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
		});

		it('does not save when the edited title is empty', () => {
			const props = renderItem();

			fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
			fireEvent.change(screen.getByLabelText('Modifier le titre'), {
				target: { value: '   ' },
			});
			fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

			expect(props.onEdit).not.toHaveBeenCalled();
			// Still in edit mode
			expect(screen.getByLabelText('Modifier le titre')).toBeInTheDocument();
		});

		it('restores original values on cancel', () => {
			const props = renderItem();

			fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
			fireEvent.change(screen.getByLabelText('Modifier le titre'), {
				target: { value: 'Changé' },
			});
			fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

			expect(props.onEdit).not.toHaveBeenCalled();
			expect(screen.getByText('Ma tâche')).toBeInTheDocument();

			// Reopening edit shows the original (reset) value, not "Changé"
			fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
			expect(
				(screen.getByLabelText('Modifier le titre') as HTMLInputElement).value,
			).toBe('Ma tâche');
		});
	});

	describe('two-step delete', () => {
		it('asks for confirmation on the first click, deletes on the second', () => {
			const props = renderItem();
			const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });

			fireEvent.click(deleteBtn);
			expect(props.onDelete).not.toHaveBeenCalled();
			expect(deleteBtn).toHaveTextContent('⚠️');

			fireEvent.click(deleteBtn);
			expect(props.onDelete).toHaveBeenCalledWith(42);
		});

		it('reverts to the idle icon after 3 seconds without a second click', () => {
			vi.useFakeTimers();
			const props = renderItem();
			const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });

			fireEvent.click(deleteBtn);
			expect(deleteBtn).toHaveTextContent('⚠️');

			act(() => {
				vi.advanceTimersByTime(3000);
			});

			expect(deleteBtn).toHaveTextContent('🗑️');
			expect(props.onDelete).not.toHaveBeenCalled();
		});
	});
});
