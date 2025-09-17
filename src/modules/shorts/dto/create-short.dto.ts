import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Category } from '@prisma/client';

export class CreateShortsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Category)
  category: Category;
}
