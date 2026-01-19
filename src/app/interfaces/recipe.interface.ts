export interface Comment {
  _id?: string;
  user: string;
  text: string;
  dateCreated?: Date;
}

export interface Recipe {
  _id?: string;
  title: string;
  ingredients: string[];
  instructions: string;
  comments?: Comment[];
  dateCreated?: Date;
  dateUpdated?: Date;
  difficulty?: 'easy' | 'medium' | 'hard';
}
