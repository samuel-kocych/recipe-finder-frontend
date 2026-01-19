import { RouterModule, Routes } from '@angular/router';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { RecipeFormComponent } from './components/recipe-form/recipe-form.component';
import { AboutComponent } from './components/about/about.component';
import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guards/auth.guard';
import { editorGuard } from './guards/editor.guard';

export const routes: Routes = [
  { path: '', component: RecipeListComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // recipe crud
  { path: 'create', component: RecipeFormComponent, canActivate: [editorGuard] },
  { path: 'edit/:id', component: RecipeFormComponent, canActivate: [editorGuard] },
  { path: 'recipes/:id', component: RecipeDetailsComponent, canActivate: [authGuard] },
  { path : '**', redirectTo: '' }
];
  