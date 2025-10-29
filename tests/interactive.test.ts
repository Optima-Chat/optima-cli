/**
 * 交互式环境检测工具测试
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { isInteractiveEnvironment, requireParam, requireNumberParam } from '../src/utils/interactive.js';
import { ValidationError } from '../src/utils/error.js';

describe('isInteractiveEnvironment', () => {
    // 保存原始环境变量和 stdin.isTTY
    let originalEnv: NodeJS.ProcessEnv;
    let originalIsTTY: boolean | undefined;

    beforeEach(() => {
        // 备份环境变量
        originalEnv = { ...process.env };
        originalIsTTY = process.stdin.isTTY;

        // 清理所有相关环境变量
        delete process.env.OPTIMA_INTERACTIVE;
        delete process.env.NON_INTERACTIVE;
        delete process.env.OPTIMA_NON_INTERACTIVE;
        delete process.env.CI;
        delete process.env.CONTINUOUS_INTEGRATION;
        delete process.env.BUILD_ID;
        delete process.env.GITHUB_ACTIONS;
        delete process.env.GITLAB_CI;
        delete process.env.CIRCLECI;
        delete process.env.TRAVIS;
    });

    afterEach(() => {
        // 恢复环境变量
        process.env = originalEnv;
        // 恢复 stdin.isTTY
        if (originalIsTTY !== undefined) {
            (process.stdin as any).isTTY = originalIsTTY;
        }
    });

    describe('优先级 0: OPTIMA_INTERACTIVE=1 强制启用', () => {
        it('should return true when OPTIMA_INTERACTIVE=1 even if not TTY', () => {
            process.env.OPTIMA_INTERACTIVE = '1';
            (process.stdin as any).isTTY = false;

            expect(isInteractiveEnvironment()).toBe(true);
        });

        it('should return true when OPTIMA_INTERACTIVE=1 even in CI environment', () => {
            process.env.OPTIMA_INTERACTIVE = '1';
            process.env.CI = 'true';
            (process.stdin as any).isTTY = true;

            expect(isInteractiveEnvironment()).toBe(true);
        });

        it('should return true when OPTIMA_INTERACTIVE=1 even with NON_INTERACTIVE=1', () => {
            process.env.OPTIMA_INTERACTIVE = '1';
            process.env.NON_INTERACTIVE = '1';
            (process.stdin as any).isTTY = true;

            expect(isInteractiveEnvironment()).toBe(true);
        });
    });

    describe('检测 1: TTY 检测', () => {
        it('should return false when stdin is not a TTY', () => {
            (process.stdin as any).isTTY = false;

            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return true when stdin is a TTY (no other flags)', () => {
            (process.stdin as any).isTTY = true;

            expect(isInteractiveEnvironment()).toBe(true);
        });
    });

    describe('检测 2: CI 环境检测', () => {
        beforeEach(() => {
            // 假设在 TTY 环境
            (process.stdin as any).isTTY = true;
        });

        it('should return false when CI=true', () => {
            process.env.CI = 'true';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when CI=1', () => {
            process.env.CI = '1';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when CONTINUOUS_INTEGRATION=true', () => {
            process.env.CONTINUOUS_INTEGRATION = 'true';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when GITHUB_ACTIONS=true', () => {
            process.env.GITHUB_ACTIONS = 'true';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when GITLAB_CI=true', () => {
            process.env.GITLAB_CI = 'true';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when CIRCLECI=true', () => {
            process.env.CIRCLECI = 'true';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when BUILD_ID=1 (Jenkins)', () => {
            process.env.BUILD_ID = '1';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when TRAVIS=true', () => {
            process.env.TRAVIS = 'true';
            expect(isInteractiveEnvironment()).toBe(false);
        });
    });

    describe('检测 3: 显式禁用标志', () => {
        beforeEach(() => {
            (process.stdin as any).isTTY = true;
        });

        it('should return false when NON_INTERACTIVE=1', () => {
            process.env.NON_INTERACTIVE = '1';
            expect(isInteractiveEnvironment()).toBe(false);
        });

        it('should return false when OPTIMA_NON_INTERACTIVE=true', () => {
            process.env.OPTIMA_NON_INTERACTIVE = 'true';
            expect(isInteractiveEnvironment()).toBe(false);
        });
    });

    describe('默认行为', () => {
        it('should return true in normal terminal environment', () => {
            (process.stdin as any).isTTY = true;
            expect(isInteractiveEnvironment()).toBe(true);
        });
    });
});

describe('requireParam', () => {
    it('should return trimmed value when parameter is provided', () => {
        const result = requireParam('  test value  ', 'param');
        expect(result).toBe('test value');
    });

    it('should throw ValidationError when parameter is undefined', () => {
        expect(() => {
            requireParam(undefined, 'title', '商品名称');
        }).toThrow(ValidationError);

        try {
            requireParam(undefined, 'title', '商品名称');
        } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).message).toContain('--title');
            expect((error as ValidationError).message).toContain('商品名称');
            expect((error as ValidationError).field).toBe('title');
        }
    });

    it('should throw ValidationError when parameter is null', () => {
        expect(() => {
            requireParam(null, 'price');
        }).toThrow(ValidationError);
    });

    it('should throw ValidationError when parameter is empty string', () => {
        expect(() => {
            requireParam('', 'stock');
        }).toThrow(ValidationError);
    });

    it('should throw ValidationError when parameter is only whitespace', () => {
        expect(() => {
            requireParam('   ', 'description');
        }).toThrow(ValidationError);
    });

    it('should use paramName as displayName when friendlyName is not provided', () => {
        try {
            requireParam(undefined, 'myParam');
        } catch (error) {
            expect((error as ValidationError).message).toContain('myParam');
        }
    });
});

describe('requireNumberParam', () => {
    it('should return parsed number when valid', () => {
        expect(requireNumberParam('42', 'count')).toBe(42);
        expect(requireNumberParam('3.14', 'pi')).toBe(3.14);
        expect(requireNumberParam('  99.99  ', 'price')).toBe(99.99);
    });

    it('should throw ValidationError when parameter is undefined', () => {
        expect(() => {
            requireNumberParam(undefined, 'price', '商品价格');
        }).toThrow(ValidationError);
    });

    it('should throw ValidationError when parameter is null', () => {
        expect(() => {
            requireNumberParam(null, 'stock');
        }).toThrow(ValidationError);
    });

    it('should throw ValidationError when parameter is empty string', () => {
        expect(() => {
            requireNumberParam('', 'weight');
        }).toThrow(ValidationError);
    });

    it('should throw ValidationError when parameter is not a number', () => {
        expect(() => {
            requireNumberParam('not a number', 'price');
        }).toThrow(ValidationError);

        try {
            requireNumberParam('abc', 'price');
        } catch (error) {
            expect((error as ValidationError).message).toContain('必须是有效数字');
        }
    });

    describe('最小值验证', () => {
        it('should pass when value equals min', () => {
            expect(requireNumberParam('10', 'stock', '库存', 10)).toBe(10);
        });

        it('should pass when value is greater than min', () => {
            expect(requireNumberParam('20', 'stock', '库存', 10)).toBe(20);
        });

        it('should throw ValidationError when value is less than min', () => {
            expect(() => {
                requireNumberParam('5', 'stock', '库存', 10);
            }).toThrow(ValidationError);

            try {
                requireNumberParam('0.001', 'price', '价格', 0.01);
            } catch (error) {
                expect((error as ValidationError).message).toContain('必须大于等于');
                expect((error as ValidationError).message).toContain('0.01');
            }
        });
    });

    describe('最大值验证', () => {
        it('should pass when value equals max', () => {
            expect(requireNumberParam('100', 'stock', '库存', 0, 100)).toBe(100);
        });

        it('should pass when value is less than max', () => {
            expect(requireNumberParam('50', 'stock', '库存', 0, 100)).toBe(50);
        });

        it('should throw ValidationError when value is greater than max', () => {
            expect(() => {
                requireNumberParam('150', 'stock', '库存', 0, 100);
            }).toThrow(ValidationError);

            try {
                requireNumberParam('1001', 'weight', '重量', 0.1, 1000);
            } catch (error) {
                expect((error as ValidationError).message).toContain('必须小于等于');
                expect((error as ValidationError).message).toContain('1000');
            }
        });
    });

    describe('范围验证', () => {
        it('should accept valid values within range', () => {
            expect(requireNumberParam('0.5', 'weight', '重量', 0.1, 1000)).toBe(0.5);
            expect(requireNumberParam('500', 'weight', '重量', 0.1, 1000)).toBe(500);
        });

        it('should reject values outside range', () => {
            expect(() => {
                requireNumberParam('0.05', 'weight', '重量', 0.1, 1000);
            }).toThrow();

            expect(() => {
                requireNumberParam('1500', 'weight', '重量', 0.1, 1000);
            }).toThrow();
        });
    });

    describe('边界情况', () => {
        it('should handle negative numbers', () => {
            expect(requireNumberParam('-5', 'temp', '温度', -10, 10)).toBe(-5);
        });

        it('should handle zero', () => {
            expect(requireNumberParam('0', 'value', '值', 0)).toBe(0);
        });

        it('should handle very small decimals', () => {
            expect(requireNumberParam('0.01', 'price', '价格', 0.01)).toBe(0.01);
        });
    });
});
