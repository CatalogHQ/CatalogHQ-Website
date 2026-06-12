import { parseAshlabNinVerificationData } from './ashlab-nin-response.parser';

describe('parseAshlabNinVerificationData', () => {
  it('parses flat snake_case responses', () => {
    const result = parseAshlabNinVerificationData(
      {
        success: true,
        data: {
          nin: '11111111111',
          first_name: 'John',
          last_name: 'Doe',
        },
      },
      '11111111111',
    );

    expect(result).toEqual({
      nin: '11111111111',
      first_name: 'John',
      last_name: 'Doe',
    });
  });

  it('parses nested live responses with camelCase names', () => {
    const result = parseAshlabNinVerificationData(
      {
        success: true,
        status: 200,
        data: {
          _raw: {
            success: true,
            data: {
              firstName: 'GODWIN',
              middleName: 'TOLUWASHE',
              lastName: 'ADIGUN',
              idNumber: '44370358877',
              mobile: '07019062597',
              dateOfBirth: '2002-05-26',
              gender: 'Male',
            },
          },
        },
        message: 'NIN Verified Successfully',
      },
      '44370358877',
    );

    expect(result).toEqual({
      nin: '44370358877',
      first_name: 'GODWIN',
      last_name: 'ADIGUN',
      middle_name: 'TOLUWASHE',
      date_of_birth: '2002-05-26',
      gender: 'Male',
      phone: '07019062597',
    });
  });

  it('returns null when names are missing', () => {
    expect(
      parseAshlabNinVerificationData({ success: true, data: { _raw: {} } }, '1'),
    ).toBeNull();
  });
});
