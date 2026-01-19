import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Recipe } from '../interfaces/recipe.interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUri}/recipes`;

  // header with JWT token
  private getHeaders(): any {
    const token = localStorage.getItem('token');
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (token && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // get all recipes from api with optional search/filter
  getRecipes(
    search?: string,
    ingredient?: string,
    difficulty?: string,
    sort?: string,
    order?: 'asc' | 'desc',
    page: number = 1,
    limit: number = 10
  ): Observable<{ recipes: Recipe[]; total: number; page: number }> {
    let params: any = { page: page.toString(), limit: limit.toString() };

    if (search) params.search = search;
    if (ingredient) params.ingredient = ingredient;
    if (difficulty) params.difficulty = difficulty;
    if (sort) params.sort = sort;
    if (order) params.order = order;

    return this.http
      .get<{ recipes: Recipe[]; total: number; page: number }>(this.apiUrl, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(retry(3), catchError(this.handleError));
  }

  // get single recipe by id
  getRecipeById(id: string): Observable<Recipe> {
    return this.http
      .get<Recipe>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(retry(1), catchError(this.handleError));
  }

  // create a new recipe
  createRecipe(recipe: Recipe): Observable<Recipe> {
    return this.http
      .post<Recipe>(this.apiUrl, recipe, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // update recipe
  updateRecipe(id: string, recipe: Recipe): Observable<Recipe> {
    return this.http
      .put<Recipe>(`${this.apiUrl}/${id}`, recipe, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // delete recipe
  deleteRecipe(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // add a comment to a recipe
  addComment(
    recipeId: string,
    comment: { user: string; text: string }
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/${recipeId}/comments`, comment, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // delete a comment from a recipe
  deleteComment(recipeId: string, commentId: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${recipeId}/comments/${commentId}`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // get a random recipe
  getRandomRecipe(): Observable<Recipe> {
    return this.http
      .get<Recipe>(`${this.apiUrl}/random`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // get total count of recipes
  getTotalRecipes(): Observable<{ totalRecipes: number }> {
    return this.http
      .get<{ totalRecipes: number }>(`${this.apiUrl}/count`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'an unknown error occurred';

    if (error.status === 401 || error.status === 403) {
      console.log('authorisation issue', error.status);
      errorMessage = 'You are not authorised for that action';
    } else if (error.status === 404) {
      errorMessage = 'recipe not found (404)';
    } else if (error.status === 500) {
      errorMessage = 'server error (500), please try again later';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `network error: ${error.error.message}`;
    }

    console.error('api error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
