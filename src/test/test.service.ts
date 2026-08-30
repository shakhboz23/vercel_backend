import { LessonService } from './../lesson/lesson.service';
import { Test_settingsService } from './../test_settings/test_settings.service';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActionType, Tests } from './models/test.models';
import { InjectModel } from '@nestjs/sequelize';
import { QuestionDto, TestsDto } from './dto/test.dto';
import { Sequelize } from 'sequelize-typescript';
import { CheckDto } from './dto/check.dto';
import { ReytingService } from '../reyting/reyting.service';
import { ReytingDto } from '../reyting/dto/reyting.dto';
import { Lesson } from 'src/lesson/models/lesson.models';
import { Course } from 'src/course/models/course.models';
import { Category } from 'src/category/models/category.models';
import { FilesService } from 'src/files/files.service';
import { Test_settings } from 'src/test_settings/models/test_settings.models';
import { SubCategory } from 'src/subcategory/models/subcategory.models';
import { BotService } from 'src/bot/bot.service';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Tests) private testsRepository: typeof Tests,
    private readonly reytingService: ReytingService,
    private readonly lessonService: LessonService,
    private readonly test_settingsService: Test_settingsService,
    private readonly fileService: FilesService,
    @Inject(forwardRef(() => BotService))
    private readonly botService: BotService,
  ) { }

  async create(testsDto: TestsDto, user_id: number): Promise<object> {
    try {
      const {
        test_type,
        test,
        lesson_id,
        start_date,
        end_date,
        sort_level,
        period,
        mix,
      } = testsDto;
      const lesson: any = await this.lessonService.getById(lesson_id);
      if (lesson.course?.user_id != user_id) {
        throw new BadRequestException("You have not access");
      }
      let variants: string[];
      if (start_date || end_date || sort_level || period) {
        await this.test_settingsService.create({
          test_type,
          lesson_id,
          start_date,
          end_date,
          sort_level,
          period,
          mix,
        });
      }
      for (let i = 0; i < test.length; i++) {
        variants = Object.values(test[i].variants);
        console.log(test[i].is_action, '2303');
        if (test[i].is_action == ActionType.edited && test[i].id) {
          await this.update(test[i].id, test[i])
        } else if (test[i].is_action == ActionType.deleted && test[i].id) {
          await this.delete(test[i].id)
        } else if (test[i].is_action != ActionType.old) {
          await this.testsRepository.create({
            lesson_id,
            question: test[i].question,
            variants,
            type: test[i].type,
            true_answer: test[i].true_answer,
          });
        }
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Created successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async create_url(file: any) {
    try {
      console.log('object');
      if (file) {
        file = await this.fileService.createFile(file, 'image');
        console.log(file);
        if (file != 'error') {
          return { statusCode: HttpStatus.OK, data: file };
        } else {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Error while uploading a file',
          };
        }
      }
    } catch (error) {
      return { statusCode: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async getAll(class_name: number): Promise<object> {
    try {
      const tests = await this.testsRepository.findAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM "lesson" WHERE "lesson"."id" = "Tests"."lesson_id" and "lesson"."class" = ${class_name})`,
              ),
              'lessonsCount',
            ],
            [
              Sequelize.literal(`(
                SELECT SUM("uploaded"."duration")
                FROM "lesson"
                INNER JOIN "video_lesson" ON "lesson"."id" = "video_lesson"."lesson_id"
                INNER JOIN "uploaded" ON "video_lesson"."video_id" = "uploaded"."id"  
                WHERE "lesson"."id" = "Tests"."lesson_id"
                AND "lesson"."class" = '${class_name}'
              )`),
              'totalDuration',
            ],
          ],
        },
      });
      return {
        statusCode: HttpStatus.OK,
        data: tests,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async hasCompletedTest(lesson_id: number, user_id: number): Promise<boolean> {
    return this.reytingService.exists(lesson_id, user_id);
  }

  async getLessonTestsCount(lesson_id: number): Promise<number> {
    try {
      const tests_count = await this.testsRepository.count({
        where: { lesson_id }
      });
      return tests_count;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getTests(): Promise<object> {
    try {
      const testss = await this.testsRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: testss,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(lesson_id: number, user_id: number): Promise<object> {
    console.log(user_id);
    // const lesson: any = this.lessonService.getById(lesson_id);

    try {
      // const test_settings: any =
      //   await this.test_settingsService.getByLessonId(id);
      // console.log(test_settings);
      // console.log(
      //   new Date(test_settings?.data?.end_date).getTime(),
      //   'test2303',
      // );
      if (
        false
        // new Date(test_settings?.data?.start_date).getTime() >
        // new Date().getTime()
      ) {
        throw new BadRequestException('start date is invalid');
      } else if (
        // new Date(test_settings?.data?.end_date).getTime() < new Date().getTime()
        false
      ) {
        throw new BadRequestException('end date is invalid');
      }

      const tests = await this.testsRepository.findAll({
        where: {
          lesson_id,
        },
        // include: [{ model: Lesson, include: [{ model: Course, include: [{ model: SubCategory }] }] }]
      });

      if (!tests) {
        throw new NotFoundException('Tests not found');
      }

      const lesson: any = await this.lessonService.getById(lesson_id);
      const category: any = await this.testsRepository.findOne({
        where: {
          lesson_id,
        },
        include: [{ model: Lesson, attributes: ['course_id', 'id'], include: [{ model: Course, attributes: ['subcategory_id'], include: [{ model: SubCategory, attributes: ['id'] }] }] }]
      });
      const test_settings: any = await this.test_settingsService.getByLessonId(lesson_id);
      let randomizedVariants: any;
      if (lesson.course.user_id != user_id) {
        // "Aralash savollar" (mix) faqat savollar tartibini tasodifiylashtiradi.
        // pdf_file testlarda savol raqamlari faylning o'zidagi raqamlarga bog'liq
        // bo'lgani uchun ularni hech qachon aralashtirmaymiz.
        const shouldShuffleOrder =
          !!test_settings?.mix && test_settings?.test_type != 'pdf_file';
        const orderedTests = shouldShuffleOrder ? this.shuffle(tests) : tests;
        if (test_settings?.test_type != 'vocabulary') {
          randomizedVariants = orderedTests.map((variant) => {
            let variants = variant.get('variants');
            const withIndex = variants.map((item, index) => ({
              value: item,
              originalIndex: index,
            }));
            const randomizedOptions = this.shuffle(withIndex);
            const newIndex = randomizedOptions.findIndex(
              item => item.originalIndex === 0
            );
            variants = randomizedOptions.map(item => item.value);

            return {
              ...variant.toJSON(),
              question: this.maskMentions(variant.question),
              variants,
              true_answer: [newIndex],
            };
          });
        } else {
          randomizedVariants = orderedTests.map((variant) => {
            const testL: number = tests.length || 2;
            const randomVariants = [variant.get('variants')[0]];
            const currentVariant = variant.get('variants')[0];

            while (randomVariants.length < 3) {
              const r = Math.floor(Math.random() * testL);
              const candidate = tests[r].variants[0];

              // Faqat bir xil bo'lmagan va takrorlanmagan variantlar qo'shiladi
              if (candidate !== currentVariant && !randomVariants.includes(candidate)) {
                randomVariants.push(candidate);
              }
            }

            const withIndex = randomVariants.map((item, index) => ({
              value: item,
              originalIndex: index,
            }));
            const randomizedOptions = this.shuffle(withIndex);
            const newIndex = randomizedOptions.findIndex(
              item => item.originalIndex === 0
            );
            const variants = randomizedOptions.map(item => item.value);

            return {
              ...variant.toJSON(),
              question: this.maskMentions(variant.question),
              variants,
              true_answer: [newIndex],
            };
          });
        }
      }
      return {
        user_id: lesson?.course.user_id,
        lesson,
        category_id: category?.lesson?.course?.category?.id,
        lesson_id: category?.lesson?.id,
        test: randomizedVariants || tests,
        test_settings,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // How many points a question is worth. A "fill" question with several
  // accepted variants (see labelFillVariants on the frontend) is worth one
  // point per variant, so a partially-correct answer still earns partial
  // credit; every other question type is worth a flat 1 point.
  private getMaxPoints(test: any): number {
    if (test?.type == 'fill' && Array.isArray(test.variants)) {
      return Math.max(test.variants.length, 1);
    }
    return 1;
  }

  // A "fill" question's `variants` are all independently-acceptable correct
  // answers (not alternate phrasings of a single answer): the student is
  // given one input per variant, and each of their answers that matches a
  // distinct variant earns one point, regardless of which input it came
  // from (so answering the variants out of order still gets full credit).
  private checkFillAnswer(id: number, test: any, answer: any): any[] {
    const variantsList: any[] = Array.isArray(test.variants) ? test.variants : [];
    const studentAnswers: any[] = (Array.isArray(answer) ? answer : [answer]).filter(
      (a) => a != null && String(a).trim() !== '',
    );
    const maxPoints = this.getMaxPoints(test);

    if (!studentAnswers.length) {
      return [id, [false], test, [], 0, maxPoints];
    }

    const normalizedVariants = variantsList.map((v) => this.containsAnswer(v.toString()));
    const usedIndexes = new Set<number>();
    let matchedCount = 0;

    for (const studentAnswer of studentAnswers) {
      const normalized = this.containsAnswer(studentAnswer.toString());
      const matchIndex = normalizedVariants.findIndex(
        (v, i) => v === normalized && !usedIndexes.has(i),
      );
      if (matchIndex >= 0) {
        usedIndexes.add(matchIndex);
        matchedCount++;
      }
    }

    // Any one matching variant is enough to mark the whole question
    // "correct" (green/red banner); the actual score still only credits the
    // distinct variants matched (see matchedCount below), so a 1-of-2 match
    // shows as correct but still earns 1 point out of 2, not full marks.
    const isCorrect = matchedCount > 0;
    return [id, [isCorrect], test, studentAnswers, matchedCount, maxPoints];
  }

  async checkById(id: number, answer: any): Promise<object> {
    try {
      const test = await this.testsRepository.findByPk(id);

      if (!test) {
        throw new NotFoundException('Tests not found');
      }
      const maxPoints = this.getMaxPoints(test);
      if (!answer || !answer?.length) {
        return [id, [false], test, [], 0, maxPoints];
      }
      if (test.type == 'fill') {
        return this.checkFillAnswer(id, test, answer);
      }
      let t = 0;
      let true_list = [];
      let selected_list: any[] = [];
      for (let i of test.true_answer) {
        selected_list.push(answer[0]?.[t]);
        if (test.variants[i] == answer[0][t]) {
          true_list.push(true);
        } else {
          true_list.push(false);
        }
        t++;
      }
      if (!true_list?.length) {
        true_list.push(false);
      }
      const isCorrect = this.checkAnswerList(true_list);
      return [id, true_list, test, selected_list, isCorrect ? 1 : 0, 1];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkAnswers(
    user_id: number,
    lesson_id: number,
    checkDto: CheckDto,
  ): Promise<object> {
    const { answers } = checkDto;
    let message: string;
    try {
      const results = {};
      const questionResults: { isCorrect: boolean; selectedLabel: string; correctLabel: string }[] = [];
      let student: any;
      let res: any[], id: number, answer: any;
      let ball = 0;
      let maxBall = 0;
      for (let i of answers) {
        if (!i?.length) {
          continue
        }
        id = +i[0];
        answer = i[1];
        res = await this.checkById(id, answer) as any[];
        const isCorrect = this.checkAnswerList(res[1]);
        results[res[0]] = isCorrect;
        const points = typeof res[4] == 'number' ? res[4] : (isCorrect ? 1 : 0);
        const maxPoints = typeof res[5] == 'number' ? res[5] : 1;
        ball += points;
        maxBall += maxPoints;
        questionResults.push({ isCorrect, ...this.describeAnswer(res[2], res[3]) });
      }
      const percentage = maxBall > 0 ? (ball / maxBall) * 100 : 0;
      console.log(percentage);
      // if (percentage >= 70) {
      const lesson: any = await this.lessonService.getById(lesson_id);
      const data: ReytingDto = {
        // role_id,
        ball,
        lesson_id,
        course_id: lesson?.course_id,
      };
      const reyting_data: any = await this.reytingService.create(
        data,
        user_id,
      );
      // await this.userStepService.create({ lesson_id, role_id });
      message = 'Your reyting has been created!'
      if (reyting_data.message == 'Already added!') {
        message = 'Already added!';
      }
      // }

      this.botService
        .notifyTestResult(
          user_id,
          lesson?.title,
          ball,
          maxBall,
          questionResults,
        )
        .catch((error) => console.log(error));

      return {
        results,
        ball: [percentage, ball],
        student,
        message,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async setAnswers(
    user_id: number,
    lesson_id: number,
    checkDto: CheckDto,
  ): Promise<object> {
    const { answers } = checkDto;
    let message: string;
    try {
      const ball: number = +answers?.filter(item => item.isTrue === true)?.reduce((total: number) => +total + 1, 0);
      const percentage = Math.round(ball / answers?.length * 100);
      const lesson: any = await this.lessonService.getById(lesson_id);
      const data: ReytingDto = {
        ball,
        lesson_id,
        course_id: lesson?.course_id,
      };
      const reyting_data: any = await this.reytingService.create(
        data,
        user_id,
      );
      // await this.userStepService.create({ lesson_id, role_id });
      message = 'Your reyting has been created!'
      
      if (reyting_data.message == 'Already added!') {
        message = 'Already added!';
      }
      
      return [percentage, ball];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async getByTitle(title: string): Promise<object> {
  //   try {
  //     const tests = await this.testsRepository.findOne({
  //       where: { title },
  //     });
  //     if (!tests) {
  //       throw new NotFoundException('Tests not found');
  //     }
  //     return {
  //       statusCode: HttpStatus.OK,
  //       data: tests,
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const testss = await this.testsRepository.findAll({ offset, limit });
      const total_count = await this.testsRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: testss,
          pagination: {
            currentPage: page,
            total_pages,
            total_count,
          },
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, questionDto: QuestionDto): Promise<object> {
    try {
      const tests = await this.testsRepository.findByPk(id);
      if (!tests) {
        throw new NotFoundException('Tests not found');
      }
      const update = await this.testsRepository.update(questionDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          tests: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const tests = await this.testsRepository.findByPk(id);
      if (!tests) {
        throw new NotFoundException('Tests not found');
      }
      tests.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Function to shuffle an array
  private shuffle(array: any[]): any[] {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }

  private maskMentions(html: string): string {
    let mentionCount = 0; // Nechta mention uchraganini sanash uchun
    return html.replace(
      /(<span[^>]*data-type="mention"[^>]*>)(@[\w👆🏾]+)(<\/span>)/g,
      (match, startTag, mentionText, endTag) => {
        mentionCount++; // Har bir uchragan mention uchun +1
        return `${startTag}<span>${mentionCount}</span>......${endTag}`;
      }
    );
  }

  private checkAnswerList(list: boolean[]): boolean {
    return list.every(item => item === true);
  }

  // Plain-text version of a question/variant's rich-text HTML, for sending
  // in a Telegram message (math formulas rendered back to their LaTeX
  // source, since KaTeX markup has no meaningful stripped-tag text).
  private stripHtml(html: string): string {
    if (!html) return '';
    const withoutMath = this.stripMathNodes(html);
    return this.decodeHtmlEntities(withoutMath.replace(/<[^>]*>/g, ''))
      .replace(/\s+/g, ' ')
      .trim();
  }

  // The correct-answer text to show a student after a wrong answer: the
  // matching variant(s) for choice questions, or the accepted value for a
  // "fill in the blank" question.
  private getCorrectAnswerText(test: any): string {
    if (!test) return '';
    if (test.type == 'fill') {
      const variants: any[] = Array.isArray(test.variants) ? test.variants : [];
      return variants
        .map((v) => this.stripHtml(String(v ?? '')))
        .filter(Boolean)
        .join(', ');
    }
    const indices: number[] = Array.isArray(test.true_answer) ? test.true_answer : [];
    return indices
      .map((index) => this.stripHtml(String(test.variants?.[index] ?? '')))
      .filter(Boolean)
      .join(', ');
  }

  private getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Per-question summary sent to the student's bot after a test: which
  // option letter(s) they picked (or the text they typed for "fill"
  // questions), and the correct one(s), so a wrong answer can be shown as
  // "chosen❌correct" without re-sending the whole question text.
  private describeAnswer(
    test: any,
    selected: any[],
  ): { selectedLabel: string; correctLabel: string } {
    if (!test) {
      return { selectedLabel: '', correctLabel: '' };
    }
    if (test.type == 'fill') {
      const selectedLabel = (selected || [])
        .map((value) => this.stripHtml(String(value ?? '')))
        .filter(Boolean)
        .join(', ');
      return {
        selectedLabel,
        correctLabel: this.getCorrectAnswerText(test),
      };
    }
    const variants: any[] = test.variants || [];
    const indices: number[] = Array.isArray(test.true_answer) ? test.true_answer : [];

    // A "pdf_file" (scanned exam) question stores only the answer key itself
    // in variants[0] (e.g. "D"), not the 4 real options the student saw on
    // paper - there's no option list to look an index up against, so show
    // the raw value the student picked and the raw key as-is instead of
    // re-encoding them into an A/B/C/D position letter.
    if (variants.length <= 1) {
      return {
        selectedLabel: this.stripHtml(String(selected?.[0] ?? '')),
        correctLabel: this.stripHtml(String(variants[indices[0] ?? 0] ?? '')),
      };
    }

    const selectedLabel = (selected || [])
      .map((value) => {
        const index = variants.findIndex((variant) => variant == value);
        return index >= 0 ? this.getOptionLetter(index) : '';
      })
      .filter(Boolean)
      .join(', ');
    const correctLabel = indices.map((index) => this.getOptionLetter(index)).join(', ');
    return { selectedLabel, correctLabel };
  }

  private containsAnswer(htmlString: string) {
    const withoutMath = this.stripMathNodes(htmlString);
    const textContent = withoutMath.replace(/<[^>]*>/g, '').trim();
    return textContent.toLowerCase();
  }

  // Formula nodes (see ilmnur_front EditorTiptapEditor's math extension) are
  // saved as KaTeX-rendered markup, e.g.
  // <span data-type="math-inline" data-latex="\frac{44}{4}"><span class="katex">...nested spans...</span></span>
  // Their rendered text has no meaningful content (a fraction's text is just
  // "44" and "4" with no "/"), so stripping tags alone can't compare them.
  // Replace each formula node with its underlying LaTeX source instead,
  // scanning span depth to find the true matching closing tag since the
  // KaTeX markup nests many <span> elements inside.
  private stripMathNodes(html: string): string {
    const openTagRegex =
      /<span[^>]*data-type="math-inline"[^>]*data-latex="([^"]*)"[^>]*>/g;
    let result = '';
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = openTagRegex.exec(html))) {
      const openStart = match.index;
      const contentStart = openStart + match[0].length;

      const spanTagRegex = /<span\b[^>]*>|<\/span>/g;
      spanTagRegex.lastIndex = contentStart;
      let depth = 1;
      let closeEnd = html.length;
      let tagMatch: RegExpExecArray | null;
      while ((tagMatch = spanTagRegex.exec(html))) {
        depth += tagMatch[0] === '</span>' ? -1 : 1;
        if (depth === 0) {
          closeEnd = spanTagRegex.lastIndex;
          break;
        }
      }

      result +=
        html.slice(cursor, openStart) +
        this.normalizeLatex(this.decodeHtmlEntities(match[1]));
      cursor = closeEnd;
      openTagRegex.lastIndex = closeEnd;
    }

    return result + html.slice(cursor);
  }

  private normalizeLatex(latex: string): string {
    return latex.replace(/\s+/g, '');
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'");
  }
}
