import { Component, inject } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../interfaces/recipe.interface';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

// type aliases, like enums but simpler
type SortField = 'title' | 'dateCreated' | 'dateUpdated';
type SortOrder = 'asc' | 'desc';
type Difficulty = 'easy' | 'medium' | 'hard';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatChipsModule,
  ],
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
})
export class RecipeListComponent {
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  Math = Math;

  searchTerm = '';
  ingredient = '';
  difficulty: Difficulty | '' = '';
  sortField: SortField = 'dateUpdated';
  sortOrder: SortOrder = 'desc';
  currentPage = 1;
  showFilters = false;

  // count and random recipe
  totalRecipes: number | null = null;
  randomRecipe: Recipe | null = null;
  loadingRandom = false;

  // trigger for reload
  private searchTrigger$ = new BehaviorSubject<void>(undefined);

  // observable stream of recipes data
  recipesData$: Observable<{
    recipes: Recipe[];
    total: number;
    page: number;
    hasSearched: boolean;
  }> = this.searchTrigger$.pipe(
    // cancels previous request if new one starts
    switchMap(() =>
      this.recipeService
        .getRecipes(
          this.searchTerm || undefined,
          this.ingredient || undefined,
          this.difficulty || undefined,
          this.sortField,
          this.sortOrder,
          this.currentPage,
          10
        )
        .pipe(
          // transform api response to our format
          map((response) => ({
            recipes: response.recipes,
            total: response.total,
            page: response.page,
            hasSearched:
              !!this.searchTerm || !!this.ingredient || !!this.difficulty,
          })),
          // if error occurs, return empty data instead of breaking
          catchError(() =>
            of({
              recipes: [],
              total: 0,
              page: 1,
              hasSearched: false,
            })
          )
        )
    )
  );

  // trigger search with current parameters
  onSearch(isNewSearch: boolean): void {
    if (isNewSearch) this.currentPage = 1;
    this.searchTrigger$.next();
  }

  // load total count
  private loadTotalRecipes(): void {
    this.recipeService.getTotalRecipes().subscribe({
      next: (res) => (this.totalRecipes = res.totalRecipes),
      error: () => (this.totalRecipes = null),
    });
  }

  // fetch a random recipe
  loadRandom(): void {
    this.loadingRandom = true;
    this.recipeService.getRandomRecipe().subscribe({
      next: (recipe) => {
        this.randomRecipe = recipe;
        this.loadingRandom = false;
      },
      error: () => {
        this.loadingRandom = false;
      },
    });
  }

  // close random recipe
  clearRandom(): void {
    this.randomRecipe = null;
  }

  // load the total count
  constructor() {
    this.loadTotalRecipes();
  }

  // go to previous page in pagination
  getPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onSearch(false);
    }
  }

  // go to next page in pagination
  getNextPage(totalResults: number): void {
    const totalPages = Math.ceil(totalResults / 10);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.onSearch(false);
    }
  }

  // navigate to recipe details page
  goToDetails(id?: string): void {
    if (!id) return;
    this.router.navigate(['/recipes', id]);
  }
}
