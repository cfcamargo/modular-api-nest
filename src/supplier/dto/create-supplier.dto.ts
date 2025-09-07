import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export enum DocumentType {
  CNPJ = 'cnpj',
  CPF = 'cpf',
}

/**
 * Validador simples para CPF/CNPJ.
 * Substitua pelas suas funções reais se já tiver (ex.: do seu utils).
 */
function isValidCPF(value: string) {
  const digits = value.replace(/\D/g, '');
  return /^\d{11}$/.test(digits); // placeholder
}
function isValidCNPJ(value: string) {
  const digits = value.replace(/\D/g, '');
  return /^\d{14}$/.test(digits); // placeholder
}

export class CreateSupplierDto {
  @IsEnum(DocumentType, { message: 'Tipo de documento deve ser cpf ou cnpj' })
  type: DocumentType;

  @IsString()
  @IsNotEmpty({ message: 'Documento é obrigatório' })
  @Transform(({ value }) => String(value ?? '').replace(/\D/g, '')) // mantém só dígitos
  document: string;

  // UM ÚNICO socialName (obrigatório para ambos os tipos)
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @Transform(({ value }) => String(value ?? '').trim())
  name: string; // PF: Nome completo | PJ: Razão social

  // fantasyName só para PJ (CNPJ)
  @ValidateIf((o) => o.documentType === DocumentType.CNPJ)
  @IsString()
  @MinLength(2, { message: 'Nome fantasia deve ter pelo menos 2 caracteres' })
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  fantasyName?: string;

  // Validação combinada do documento conforme o tipo
  // (opcional: se você já usa um Pipe global, pode mover para lá)
  validateDocument() {
    if (this.type === DocumentType.CNPJ && !isValidCNPJ(this.document)) {
      throw new Error('CNPJ inválido');
    }
    if (this.type === DocumentType.CPF && !isValidCPF(this.document)) {
      throw new Error('CPF inválido');
    }
  }
}

/**
 * Update parcial.
 * Se quiser manter as mesmas regras condicionais, pode sobrescrever
 * as mensagens no service ou usar um custom pipe para validação combinada.
 */
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
