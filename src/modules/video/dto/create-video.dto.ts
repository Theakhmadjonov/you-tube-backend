import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsEnum } from 'class-validator';
import { Category } from '@prisma/client';

export class CreateVideoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(Category)
  category: Category;
}
