import { describe, it, expect } from 'vitest';
import { Slug } from '@/modules/catalogo/domain/slug';
import { Sku } from '@/modules/catalogo/domain/sku';
import { Volume } from '@/modules/catalogo/domain/volume';
import { PiramideOlfativa } from '@/modules/catalogo/domain/piramide-olfativa';

describe('Value Objects do Catálogo', () => {
  describe('Slug', () => {
    it('RN-010: deve criar slug válido em kebab-case a partir de texto', () => {
      const slug = Slug.criarAPartirDoNome('Noir Absolu Extrait!');
      expect(slug.isSuccess()).toBe(true);
      expect(slug.value?.valor).toBe('noir-absolu-extrait');
    });

    it('RN-010: deve rejeitar slug vazio ou em formato inválido', () => {
      const slugVazio = Slug.criar('');
      const slugInvalido = Slug.criar('Noir Absolu Com Espacos');
      expect(slugVazio.isFailure()).toBe(true);
      expect(slugInvalido.isFailure()).toBe(true);
    });
  });

  describe('Sku', () => {
    it('RN-011: deve normalizar e aceitar SKU padronizado', () => {
      const sku = Sku.criar('rare-noir-50ml');
      expect(sku.isSuccess()).toBe(true);
      expect(sku.value?.valor).toBe('RARE-NOIR-50ML');
    });

    it('RN-011: deve rejeitar SKU com caracteres inválidos ou vazio', () => {
      const skuVazio = Sku.criar('');
      const skuInvalido = Sku.criar('SKU@INVALIDO#');
      expect(skuVazio.isFailure()).toBe(true);
      expect(skuInvalido.isFailure()).toBe(true);
    });
  });

  describe('Volume', () => {
    it('RN-012: deve aceitar volume em ml inteiro e positivo', () => {
      const volume = Volume.criar(50);
      expect(volume.isSuccess()).toBe(true);
      expect(volume.value?.valor).toBe(50);
      expect(volume.value?.formatado).toBe('50ml');
    });

    it('RN-012: deve rejeitar volume zero ou negativo', () => {
      const volumeZero = Volume.criar(0);
      const volumeNegativo = Volume.criar(-10);
      expect(volumeZero.isFailure()).toBe(true);
      expect(volumeNegativo.isFailure()).toBe(true);
    });
  });

  describe('PiramideOlfativa', () => {
    it('RN-014: deve aceitar pirâmide com notas de topo, coração e base preenchidas', () => {
      const piramide = PiramideOlfativa.criar({
        topo: ['Bergamota'],
        coracao: ['Íris'],
        base: ['Âmbar'],
      });
      expect(piramide.isSuccess()).toBe(true);
      expect(piramide.value?.topo).toEqual(['Bergamota']);
    });

    it('RN-014: deve rejeitar pirâmide com algum dos 3 níveis vazio', () => {
      const semBase = PiramideOlfativa.criar({
        topo: ['Bergamota'],
        coracao: ['Rosa'],
        base: [],
      });
      expect(semBase.isFailure()).toBe(true);
    });
  });
});