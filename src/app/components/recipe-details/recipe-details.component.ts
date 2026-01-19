import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap, catchError, of, BehaviorSubject } from 'rxjs';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../interfaces/recipe.interface';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { AuthCustomService } from '../../services/auth-custom.service';

@Component({
  selector: 'app-recipe-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent {
  // services
  private route = inject(ActivatedRoute);
  private service = inject(RecipeService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // state
  showFull = signal(false);
  submitting = false;
  recipeId = '';
  private reloadSubject = new BehaviorSubject<void>(undefined);
  private authService = inject(AuthCustomService);
  isAuthenticated$ = this.authService.isAuthenticated$;
  isEditor$ = this.authService.isEditor$;
  isAdmin$ = this.authService.isAdmin$;

  // recipe stream by id
  recipe$ = this.route.paramMap.pipe(
    switchMap((params) => {
      this.recipeId = params.get('id') ?? '';
      return this.reloadSubject.pipe(
        switchMap(() => this.service.getRecipeById(this.recipeId)),
        catchError(() => of(null as unknown as Recipe))
      );
    })
  );

  // comment form
  commentForm = inject(FormBuilder).group({
    user: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(32)],
    ],
    text: ['', [Validators.required, Validators.maxLength(300)]],
  });

  get user() {
    return this.commentForm.get('user');
  }
  get text() {
    return this.commentForm.get('text');
  }

  // toggle full instructions
  toggleDescription(): void {
    this.showFull.update((v) => !v);
  }

  // add comment
  submitComment(): void {
    if (this.commentForm.invalid || this.submitting) return;

    this.submitting = true;
    this.service
      .addComment(
        this.recipeId,
        this.commentForm.value as { user: string; text: string }
      )
      .subscribe({
        next: () => {
          this.commentForm.reset();
          this.submitting = false;
          this.reloadSubject.next();
          this.showSnackBar('Comment added successfully', 'success');
        },
        error: (err: Error) => {
          this.submitting = false;
          this.showSnackBar('Failed to add comment: ' + err.message, 'error');
        },
      });
  }

  // delete comment with confirm
  deleteComment(commentId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment?',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.service.deleteComment(this.recipeId, commentId).subscribe({
          next: () => {
            this.reloadSubject.next();
            this.showSnackBar('Comment deleted', 'success');
          },
          error: (err: Error) =>
            this.showSnackBar(
              'Failed to delete comment: ' + err.message,
              'error'
            ),
        });
      }
    });
  }

  // delete recipe with confirm
  deleteRecipe(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Delete Recipe',
        message: 'Are you sure you want to delete this recipe?',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && this.recipeId) {
        this.service.deleteRecipe(this.recipeId).subscribe({
          next: () => {
            this.showSnackBar('Recipe deleted', 'success');
            this.router.navigateByUrl('/');
          },
          error: (err: Error) =>
            this.showSnackBar(
              'Failed to delete recipe: ' + err.message,
              'error'
            ),
        });
      }
    });
  }

  // show snackbar notification
  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, type === 'success' ? 'OK' : 'Dismiss', {
      duration: type === 'success' ? 4000 : 15000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
