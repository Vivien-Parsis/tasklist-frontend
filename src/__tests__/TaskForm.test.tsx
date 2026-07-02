import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

function getTitleInput() {
	return screen.getByLabelText('Titre') as HTMLInputElement;
}

function getDescriptionInput() {
	return screen.getByLabelText('Description') as HTMLTextAreaElement;
}

function submitForm() {
	fireEvent.submit(screen.getByTestId('task-form'));
}

describe('TaskForm', () => {
	describe('rendering', () => {
		it('renders create labels by default', () => {
			render(<TaskForm onSubmit={vi.fn()} />);

			expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: 'Ajouter' }),
			).toBeInTheDocument();
		});

		it('renders edit labels in edit mode', () => {
			render(<TaskForm onSubmit={vi.fn()} mode="edit" />);

			expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: 'Modifier' }),
			).toBeInTheDocument();
		});

		it('prefills fields from initialValues', () => {
			render(
				<TaskForm
					onSubmit={vi.fn()}
					initialValues={{ title: 'Old title', description: 'Old desc' }}
				/>,
			);

			expect(getTitleInput().value).toBe('Old title');
			expect(getDescriptionInput().value).toBe('Old desc');
		});

		it('does not render a cancel button without onCancel', () => {
			render(<TaskForm onSubmit={vi.fn()} />);

			expect(
				screen.queryByRole('button', { name: 'Annuler' }),
			).not.toBeInTheDocument();
		});

		it('renders a cancel button and calls onCancel when provided', () => {
			const onCancel = vi.fn();
			render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);

			fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

			expect(onCancel).toHaveBeenCalledTimes(1);
		});
	});

	describe('validation', () => {
		it('shows an error and does not submit when the title is empty', () => {
			const onSubmit = vi.fn();
			render(<TaskForm onSubmit={onSubmit} />);

			submitForm();

			expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
			expect(getTitleInput().className).toContain('input-error');
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('treats a whitespace-only title as empty', () => {
			const onSubmit = vi.fn();
			render(<TaskForm onSubmit={onSubmit} />);

			fireEvent.change(getTitleInput(), { target: { value: '   ' } });
			submitForm();

			expect(screen.getByRole('alert')).toBeInTheDocument();
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('clears the error as soon as the user types in the title', () => {
			render(<TaskForm onSubmit={vi.fn()} />);

			submitForm();
			expect(screen.getByRole('alert')).toBeInTheDocument();

			fireEvent.change(getTitleInput(), { target: { value: 'A' } });

			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});
	});

	describe('submission', () => {
		it('submits a trimmed title with description undefined when empty', () => {
			const onSubmit = vi.fn();
			render(<TaskForm onSubmit={onSubmit} />);

			fireEvent.change(getTitleInput(), { target: { value: '  Buy milk  ' } });
			submitForm();

			expect(onSubmit).toHaveBeenCalledWith({
				title: 'Buy milk',
				description: undefined,
			});
		});

		it('submits both trimmed title and description', () => {
			const onSubmit = vi.fn();
			render(<TaskForm onSubmit={onSubmit} />);

			fireEvent.change(getTitleInput(), { target: { value: 'Title' } });
			fireEvent.change(getDescriptionInput(), {
				target: { value: '  Some details  ' },
			});
			submitForm();

			expect(onSubmit).toHaveBeenCalledWith({
				title: 'Title',
				description: 'Some details',
			});
		});

		it('resets the fields after submit in create mode', () => {
			render(<TaskForm onSubmit={vi.fn()} />);

			fireEvent.change(getTitleInput(), { target: { value: 'Title' } });
			fireEvent.change(getDescriptionInput(), { target: { value: 'Desc' } });
			submitForm();

			expect(getTitleInput().value).toBe('');
			expect(getDescriptionInput().value).toBe('');
		});

		it('keeps the fields after submit in edit mode', () => {
			render(
				<TaskForm
					onSubmit={vi.fn()}
					mode="edit"
					initialValues={{ title: 'Old', description: 'Old desc' }}
				/>,
			);

			fireEvent.change(getTitleInput(), { target: { value: 'New' } });
			submitForm();

			expect(getTitleInput().value).toBe('New');
		});
	});
});
