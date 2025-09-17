import { PartialType } from '@nestjs/mapped-types';
import { CreateShortsDto } from './create-short.dto';

export class UpdateShortDto extends PartialType(CreateShortsDto) {}
